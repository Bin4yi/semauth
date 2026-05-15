"""
Dynamic orchestrator with full mandate chain threading.

For each agent hop:
  1. Derive mandate — narrowed from original task + parent's verified_output
  2. Execute agent with mandate as context
  3. SemAuth gate — 3 layers including full chain entailment
  4. Issue JWT with mandate chain claims if all layers pass
  5. Thread verified_output to next hop's mandate derivation
"""

import asyncio
import json
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from openai import OpenAI
from db import get_agent
from models import WorkflowRequest
from agents.executor import execute_agent
from semauth.gate import evaluate
from iam.simulated_is import create_user_token, issue_scoped_token
from iam.delegation_chain import DelegationChain

openai_client = OpenAI()


def derive_mandate(
    original_task: str,
    agent_name: str,
    agent_description: str,
    parent_output: str = "",
) -> str:
    """
    Derives the narrowed mandate for this agent hop.
    Root hop: mandate = original task (no narrowing yet)
    Subsequent hops: mandate derived from parent's verified output
    """
    if not parent_output:
        return original_task

    try:
        r = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0,
            messages=[{
                "role": "user",
                "content": (
                    f"Original task: \"{original_task}\"\n"
                    f"Previous agent established: \"{parent_output}\"\n"
                    f"Next agent: {agent_name} — {agent_description}\n\n"
                    "Write ONE sentence: what specific, narrow action is this agent authorized to take, "
                    "derived from what the previous agent established? "
                    "Do not expand scope beyond what the previous output implies."
                ),
            }],
        )
        return r.choices[0].message.content.strip()
    except Exception as e:
        print(f"Mandate derivation error: {e}")
        return original_task


def build_chain_context(delegation_chain: DelegationChain) -> str:
    """Human-readable chain context passed to CVIC detector."""
    if not delegation_chain.hops:
        return ""
    lines = [f"Original task: {delegation_chain.original_task}"]
    for hop in delegation_chain.hops:
        lines.append(
            f"[{hop.agent_name}] mandate: {hop.mandate} "
            f"→ output: {hop.verified_output[:100]}"
        )
    return "\n".join(lines)


async def run_workflow(request: WorkflowRequest):
    agents = []
    for agent_id in request.agent_ids:
        agent = get_agent(agent_id)
        if not agent:
            yield {"type": "error", "data": {"message": f"Agent {agent_id} not found"}}
            return
        agents.append(agent)

    delegation_chain = DelegationChain(
        user_id="demo-user",
        original_task=request.task,
    )

    yield {
        "type": "workflow_start",
        "data": {
            "task": request.task,
            "injection": request.inject,
            "agents": [{"id": a.id, "name": a.name} for a in agents],
        },
    }

    completed = []

    for agent in agents:
        yield {
            "type": "agent_start",
            "data": {"agent_id": agent.id, "agent_name": agent.name},
        }

        # ── Phase 1: Derive mandate for this hop ─────────────────────────────
        parent_hop = delegation_chain.last_hop()
        mandate = derive_mandate(
            original_task=request.task,
            agent_name=agent.name,
            agent_description=agent.description,
            parent_output=parent_hop.verified_output if parent_hop else "",
        )

        yield {
            "type": "mandate_derived",
            "data": {
                "agent_id": agent.id,
                "agent_name": agent.name,
                "mandate": mandate,
                "mandate_depth": len(delegation_chain.hops) + 1,
                "derived_from": parent_hop.agent_name if parent_hop else "original task",
            },
        }

        # ── Phase 2: Execute agent with mandate as context ────────────────────
        # Per-agent injection — simulates malicious content in a tool response
        # (e.g. agent reads a file/email that contains injected instructions)
        agent_injection = request.agent_injections.get(agent.id) or request.inject

        execution = execute_agent(
            agent=agent,
            task=request.task,
            context=f"Your mandate for this delegation hop: {mandate}",
            injection=agent_injection,
        )

        yield {
            "type": "agent_reasoning",
            "data": {
                "agent_id": agent.id,
                "agent_name": agent.name,
                "reasoning_steps": execution["reasoning_steps"],
                "tool_calls": execution["tool_calls_made"],
            },
        }

        # ── Phase 3: SemAuth gate (3 layers) ─────────────────────────────────
        yield {
            "type": "semauth_evaluating",
            "data": {"agent_id": agent.id, "agent_name": agent.name},
        }

        await asyncio.sleep(0.3)

        chain_context = build_chain_context(delegation_chain)

        verdict = evaluate(
            original_task=request.task,
            current_mandate=mandate,
            reasoning=execution["reasoning_trace"],
            agent_name=agent.name,
            action=f"Execute {agent.name}: {execution['final_response'][:120]}",
            prior_hops=delegation_chain.hops,
            chain_context=chain_context,
        )

        yield {
            "type": "semauth_verdict",
            "data": {
                "agent_id": agent.id,
                "agent_name": agent.name,
                "verdict": verdict,
                "reasoning_trace": execution["reasoning_trace"][:600],
                "mandate": mandate,
            },
        }

        # ── Phase 4: Issue JWT or block ───────────────────────────────────────
        token_result = issue_scoped_token(
            user_id="demo-user",
            agent_id=agent.id,
            agent_name=agent.name,
            scopes=agent.scopes,
            reasoning_trace=execution["reasoning_trace"],
            verified_output=execution["final_response"],
            mandate=mandate,
            delegation_chain=delegation_chain,
            semauth_verdict=verdict,
        )

        if not token_result["issued"]:
            # Determine whether CVIC or chain entailment blocked it
            blocked_by = "CVIC" if verdict["cvic"]["detected"] else "Chain Entailment"
            weakest = verdict["chain"].get("weakest_link")

            yield {
                "type": "semauth_blocked",
                "data": {
                    "agent_id": agent.id,
                    "agent_name": agent.name,
                    "agent_scopes": agent.scopes,
                    "blocked_by": blocked_by,
                    "cvic_class": verdict["cvic"]["class_name"],
                    "cvic_confidence": verdict["cvic"]["confidence"],
                    "cvic_reason": verdict["cvic"]["reason"],
                    "similarity_would_miss": verdict["cvic"]["similarity_would_miss"],
                    "chain_checks": verdict["chain"],
                    "weakest_link": weakest,
                    "entailment_gap": verdict["entailment_gap_demonstrated"],
                    "similarity_score": verdict["similarity_score"],
                    "mandate": mandate,
                    "delegation_chain": delegation_chain.summary(),
                    "downstream_protected": [
                        a.name for a in agents
                        if a.id not in [c["agent_id"] for c in completed]
                        and a.id != agent.id
                    ],
                },
            }
            yield {
                "type": "workflow_blocked",
                "data": {
                    "completed": completed,
                    "blocked_at": agent.name,
                    "delegation_chain": delegation_chain.summary(),
                },
            }
            return

        yield {
            "type": "token_issued",
            "data": {
                "agent_id": agent.id,
                "agent_name": agent.name,
                "scopes": agent.scopes,
                "act_chain_depth": token_result["act_chain_depth"],
                "ii_verified": True,
                "trace_hash": token_result["trace_hash"][:12] + "...",
                "jwt_claims": {
                    k: v for k, v in token_result["claims"].items()
                    if k not in ("iat", "exp")   # skip raw timestamps for display
                },
            },
        }

        yield {
            "type": "agent_complete",
            "data": {
                "agent_id": agent.id,
                "agent_name": agent.name,
                "result": execution["final_response"],
                "tool_calls": execution["tool_calls_made"],
                "mandate": mandate,
            },
        }

        completed.append({"agent_id": agent.id, "agent_name": agent.name})

    yield {
        "type": "workflow_complete",
        "data": {
            "completed": completed,
            "delegation_chain": delegation_chain.summary(),
            "all_verified": True,
        },
    }
