"""
Delegation chain with mandate propagation.

Each hop carries:
  - mandate:        the narrowed purpose assigned to this agent
  - verified_output: what the agent actually did (locked after SemAuth pass)

The chain enables full entailment verification at every subsequent hop.
"""

import hashlib
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class DelegationHop:
    agent_id: str
    agent_name: str
    scopes: list[str]
    semauth_passed: bool

    # Mandate chain fields
    mandate: str = ""
    verified_output: str = ""
    mandate_hash: str = field(init=False, default="")
    verified_output_hash: str = field(init=False, default="")
    cvic_class: Optional[str] = None

    def __post_init__(self):
        if self.mandate:
            self.mandate_hash = hashlib.sha256(self.mandate.encode()).hexdigest()[:16]
        if self.verified_output:
            self.verified_output_hash = hashlib.sha256(self.verified_output.encode()).hexdigest()[:16]

    def to_act_claim(self, inner: Optional[dict] = None) -> dict:
        claim: dict = {"sub": self.agent_id}
        if inner:
            claim["act"] = inner
        return claim


@dataclass
class DelegationChain:
    user_id: str = "demo-user"
    original_task: str = ""
    hops: list[DelegationHop] = field(default_factory=list)

    def add_hop(self, hop: DelegationHop):
        self.hops.append(hop)

    def build_act_chain(self) -> Optional[dict]:
        if not self.hops:
            return None
        chain = None
        for hop in self.hops:
            chain = hop.to_act_claim(inner=chain)
        return chain

    def last_hop(self) -> Optional[DelegationHop]:
        return self.hops[-1] if self.hops else None

    def summary(self) -> list[dict]:
        return [
            {
                "agent_id": h.agent_id,
                "agent_name": h.agent_name,
                "scopes": h.scopes,
                "semauth_passed": h.semauth_passed,
                "cvic_class": h.cvic_class,
                "mandate": h.mandate,
                "verified_output": h.verified_output[:120] if h.verified_output else "",
                "mandate_hash": h.mandate_hash,
                "verified_output_hash": h.verified_output_hash,
            }
            for h in self.hops
        ]

    def is_blocked(self) -> bool:
        return any(not h.semauth_passed for h in self.hops)
