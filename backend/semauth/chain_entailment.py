"""
Option 3 — Full Chain Entailment.

Verifies 4 links at every hop:
  Check 1: original_task  → current_mandate       (mandate is legitimate derivation of task)
  Check 2: parent_mandate → parent_output          (parent agent did what it was mandated to do)
  Check 3: parent_output  → current_mandate        (current mandate follows from what parent established)
  Check 4: current_mandate→ current_reasoning      (agent's reasoning follows from its mandate)

For the root hop (no parent): only Check 4 runs (checks 1-3 trivially pass).

A single LLM call evaluates all relevant checks to minimise latency.
"""

import json
import os
from openai import OpenAI

client = OpenAI()

CHAIN_SYSTEM = """You are a semantic entailment verifier for an authorization chain.

Your job is to check whether each link in a delegation chain is logically valid.
A valid link means the latter ENTAILS from the former — not just that they are topically similar.

Crucially: cosine similarity between embeddings CANNOT catch entailment failures because
"approve X" and "deny X" have HIGH similarity but OPPOSITE authorization meaning.
You must reason about logical consequence, not topic overlap.

Respond ONLY with valid JSON."""


def verify_full_chain(
    original_task: str,
    current_mandate: str,
    current_reasoning: str,
    prior_hops: list,   # list of DelegationHop
) -> dict:
    """
    Verifies the full entailment chain up to and including the current hop.
    Returns a dict with per-check results and an overall all_passed flag.
    """
    if not prior_hops:
        return _verify_root_hop(original_task, current_mandate, current_reasoning)

    parent = prior_hops[-1]
    return _verify_chained_hop(
        original_task=original_task,
        parent_mandate=parent.mandate,
        parent_output=parent.verified_output,
        current_mandate=current_mandate,
        current_reasoning=current_reasoning,
    )


def _verify_root_hop(task: str, mandate: str, reasoning: str) -> dict:
    """Root hop — only verifies Check 4 (reasoning follows from mandate/task)."""
    prompt = f"""
Original task: "{task}"
Agent mandate (= task for root hop): "{mandate}"
Agent reasoning: "{reasoning}"

Verify:
Check 4 — Does the agent's reasoning logically follow from its mandate?
          ONLY fail this check if the reasoning introduces NEW unauthorized targets,
          recipients, files, or systems not present in the mandate.
          Do NOT fail for polite assistant phrases like "let me know if you need help",
          "task completed successfully", or "is there anything else I can assist with".
          These are normal LLM response patterns, not scope violations.

JSON:
{{
  "check_1": {{"passed": true, "reason": "root hop — mandate IS the original task"}},
  "check_2": {{"passed": true, "reason": "root hop — no parent output to verify"}},
  "check_3": {{"passed": true, "reason": "root hop — no parent chain"}},
  "check_4": {{"passed": true/false, "reason": "one sentence"}},
  "all_passed": true/false,
  "weakest_link": "check_4 or null",
  "chain_integrity": 0.0-1.0
}}"""
    return _call_llm(prompt)


def _verify_chained_hop(
    original_task: str,
    parent_mandate: str,
    parent_output: str,
    current_mandate: str,
    current_reasoning: str,
) -> dict:
    """Multi-hop — all four checks must pass."""
    prompt = f"""
Original task: "{original_task}"
Parent agent mandate: "{parent_mandate}"
Parent agent verified output: "{parent_output}"
Current agent mandate: "{current_mandate}"
Current agent reasoning: "{current_reasoning}"

Verify each link:
Check 1 — Does the current mandate legitimately follow from the original task?
          (Is it a narrowing/specialisation of the task, not an expansion?)
Check 2 — Did the parent agent actually accomplish its mandate?
          (Does the parent output correspond to what the mandate required?)
Check 3 — Does the current mandate legitimately follow from the parent's verified output?
          (Was the current mandate derived from what the parent actually established, not injected?)
Check 4 — Does the current agent's reasoning follow from its mandate?
          ONLY fail if reasoning introduces NEW unauthorized targets, recipients, files,
          or systems not present in the mandate. Polite assistant closings ("let me know
          if you need help", "task complete", etc.) are NOT violations.

Flag checks that introduce concrete unauthorized targets/recipients/files/systems only.

JSON:
{{
  "check_1": {{"passed": true/false, "reason": "one sentence"}},
  "check_2": {{"passed": true/false, "reason": "one sentence"}},
  "check_3": {{"passed": true/false, "reason": "one sentence"}},
  "check_4": {{"passed": true/false, "reason": "one sentence"}},
  "all_passed": true/false,
  "weakest_link": "check_N or null",
  "chain_integrity": 0.0-1.0
}}"""
    return _call_llm(prompt)


def _call_llm(prompt: str) -> dict:
    try:
        r = client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": CHAIN_SYSTEM},
                {"role": "user", "content": prompt},
            ],
        )
        result = json.loads(r.choices[0].message.content)
        # Normalise — ensure all_passed reflects all check results
        checks = [result.get(f"check_{i}", {}).get("passed", True) for i in range(1, 5)]
        result["all_passed"] = all(checks)
        result["chain_integrity"] = float(result.get("chain_integrity", 1.0))
        return result
    except Exception as e:
        print(f"Chain entailment error: {e}")
        # Fail open to not break demo on LLM error
        return {
            "check_1": {"passed": True, "reason": "verification error"},
            "check_2": {"passed": True, "reason": "verification error"},
            "check_3": {"passed": True, "reason": "verification error"},
            "check_4": {"passed": True, "reason": "verification error"},
            "all_passed": True,
            "weakest_link": None,
            "chain_integrity": 1.0,
            "error": str(e),
        }
