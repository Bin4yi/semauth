"""All Pydantic models for the SemAuth platform."""

from typing import Any, Optional
from pydantic import BaseModel, Field
import uuid


class AgentTool(BaseModel):
    name: str
    description: str
    parameters: dict[str, str] = Field(default_factory=dict)
    simulated_response: str


class AgentConfig(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    name: str
    description: str
    system_prompt: str
    scopes: list[str]
    tools: list[AgentTool] = Field(default_factory=list)
    a2a_url: str = ""
    a2a_version: str = "1.0.0"
    can_delegate_to: list[str] = Field(default_factory=list)


class AgentCreate(BaseModel):
    name: str
    description: str
    system_prompt: str
    scopes: list[str]
    tools: list[AgentTool] = []
    can_delegate_to: list[str] = []


class WorkflowRequest(BaseModel):
    task: str
    agent_ids: list[str]
    inject: Optional[str] = None  # legacy: global injection
    agent_injections: dict[str, str] = Field(default_factory=dict)  # agent_id -> injection


class ActorClaim(BaseModel):
    sub: str
    act: Optional["ActorClaim"] = None


class JWTClaims(BaseModel):
    sub: str
    scope: str
    act: Optional[ActorClaim] = None
    ii_verified: bool = False
    ii_trace_hash: str = ""
    ii_check_ts: str = ""
    iss: str = "semauth-simulated-is"


class WorkflowEvent(BaseModel):
    type: str
    data: dict[str, Any] = Field(default_factory=dict)


class EvalRequest(BaseModel):
    task: str
    reasoning: str
    agent_name: str
    action: str = ""
