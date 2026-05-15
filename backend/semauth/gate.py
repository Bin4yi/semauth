"""
SemAuth gate — three-layer Intent Integrity check.

Layer 1: cosine_sim(mandate, reasoning)       ← shown failing on CVIC
Layer 2: CVIC detector (LLM)                  ← shown catching it
Layer 3: Full chain entailment (4 checks)     ← verifies entire delegation chain

Token issued only if all three layers pass.
"""

from semauth.similarity import compute_similarity, THRESHOLD
from semauth.cvic_detector import detect_cvic, CVIC_THRESHOLD
from semauth.chain_entailment import verify_full_chain


def evaluate(
    original_task: str,
    current_mandate: str,
    reasoning: str,
    agent_name: str,
    action: str,
    prior_hops: list,           # list of DelegationHop from delegation_chain
    chain_context: str = "",    # human-readable summary of prior hops for CVIC prompt
) -> dict:
    # Layer 1 — cosine similarity against MANDATE (not raw task)
    sim_score = compute_similarity(current_mandate, reasoning)
    sim_verdict = (
        "PASS" if sim_score >= THRESHOLD
        else "SUSPICIOUS" if sim_score >= THRESHOLD * 0.85
        else "FAIL"
    )

    # Layer 2 — CVIC detector (mandate + chain context)
    cvic = detect_cvic(current_mandate, reasoning, agent_name, action, chain_context)

    # Layer 3 — Full chain entailment
    chain_result = verify_full_chain(
        original_task=original_task,
        current_mandate=current_mandate,
        current_reasoning=reasoning,
        prior_hops=prior_hops,
    )

    # Token issued only if CVIC clean AND chain fully valid
    token_issued = not cvic["detected"] and chain_result["all_passed"]

    # Entailment Gap: similarity passes but CVIC or chain catches the attack
    entailment_gap = sim_score >= THRESHOLD and (cvic["detected"] or not chain_result["all_passed"])

    return {
        "intent_integrity_score": round(1.0 - cvic["confidence"], 4),
        "current_mandate": current_mandate,
        "similarity_score": sim_score,
        "similarity_verdict": sim_verdict,
        "similarity_threshold": THRESHOLD,
        "cvic": cvic,
        "chain": chain_result,
        "token_issued": token_issued,
        "entailment_gap_demonstrated": entailment_gap,
    }
