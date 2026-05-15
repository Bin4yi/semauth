"""
Simulated IS — issues RFC 8693 JWTs with full mandate chain and Intent Integrity claims.

JWT carries:
  mandate              — narrowed purpose for this hop
  mandate_root         — original task (unchanged)
  mandate_depth        — hop number
  mandate_hash         — sha256 commitment to mandate
  parent_mandate_hash  — links to parent hop (chain integrity)
  parent_output_hash   — commitment to parent's verified output
  verified_output      — what this agent actually did (locked after SemAuth pass)
  verified_output_hash — sha256 commitment
  ii_chain_valid       — True if all 4 chain entailment checks passed
  ii_chain_checks      — number of checks that ran
"""

import jwt
import hashlib
import datetime
import os
from typing import Optional
from iam.delegation_chain import DelegationChain, DelegationHop

SECRET = os.getenv("SIMULATED_IS_SECRET", "semauth-demo-secret")


def create_user_token(user_id: str = "demo-user") -> str:
    payload = {
        "sub": user_id,
        "type": "delegated_user",
        "iat": datetime.datetime.utcnow(),
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1),
    }
    return jwt.encode(payload, SECRET, algorithm="HS256")


def issue_scoped_token(
    user_id: str,
    agent_id: str,
    agent_name: str,
    scopes: list[str],
    reasoning_trace: str,
    verified_output: str,
    mandate: str,
    delegation_chain: DelegationChain,
    semauth_verdict: dict,
) -> dict:
    if not semauth_verdict["token_issued"]:
        reason = (
            semauth_verdict["cvic"]["class_name"]
            or f"Chain check failed: {semauth_verdict['chain'].get('weakest_link')}"
            or "SemAuth blocked"
        )
        return {"issued": False, "reason": reason}

    trace_hash = hashlib.sha256(reasoning_trace.encode()).hexdigest()
    output_hash = hashlib.sha256(verified_output.encode()).hexdigest()[:16]
    mandate_hash = hashlib.sha256(mandate.encode()).hexdigest()[:16]

    parent_hop = delegation_chain.last_hop()
    parent_mandate_hash = parent_hop.mandate_hash if parent_hop else None
    parent_output_hash = parent_hop.verified_output_hash if parent_hop else None

    chain_result = semauth_verdict["chain"]
    checks_passed = sum(
        1 for i in range(1, 5)
        if chain_result.get(f"check_{i}", {}).get("passed", True)
    )

    # Add hop to chain AFTER computing hashes
    hop = DelegationHop(
        agent_id=agent_id,
        agent_name=agent_name,
        scopes=scopes,
        semauth_passed=True,
        mandate=mandate,
        verified_output=verified_output,
    )
    delegation_chain.add_hop(hop)
    act_chain = delegation_chain.build_act_chain()

    now = datetime.datetime.utcnow()
    payload = {
        # Standard OAuth / RFC 8693 claims
        "sub": user_id,
        "scope": " ".join(scopes),
        "iss": "semauth-simulated-is",
        "aud": agent_id,
        "iat": now,
        "exp": now + datetime.timedelta(minutes=5),
        "act": act_chain,

        # Mandate chain claims (novel contribution)
        "mandate": mandate,
        "mandate_root": delegation_chain.original_task,
        "mandate_depth": len(delegation_chain.hops),
        "mandate_hash": mandate_hash,
        "parent_mandate_hash": parent_mandate_hash,
        "parent_output_hash": parent_output_hash,
        "verified_output": verified_output[:200],
        "verified_output_hash": output_hash,

        # Intent Integrity claims
        "ii_verified": True,
        "ii_trace_hash": trace_hash[:16] + "...",
        "ii_check_ts": now.isoformat(),
        "ii_cvic_score": round(1.0 - semauth_verdict["cvic"]["confidence"], 3),
        "ii_chain_valid": chain_result["all_passed"],
        "ii_chain_integrity": chain_result.get("chain_integrity", 1.0),
        "ii_chain_checks": checks_passed,
    }

    token = jwt.encode(payload, SECRET, algorithm="HS256")

    serialisable_claims = {
        k: (v.isoformat() if isinstance(v, datetime.datetime) else v)
        for k, v in payload.items()
    }

    return {
        "issued": True,
        "token": token,
        "claims": serialisable_claims,
        "trace_hash": trace_hash,
        "act_chain_depth": len(delegation_chain.hops),
    }
