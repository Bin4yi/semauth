import asyncio
import json
import os

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from db import init_db, save_agent, get_agent, list_agents, delete_agent
from models import AgentConfig, AgentCreate, WorkflowRequest, EvalRequest
from orchestrator.orchestrator import run_workflow
from semauth.gate import evaluate
import scenarios as scenarios_module

app = FastAPI(title="SemAuth")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    init_db()


# ── Agent Registry ────────────────────────────────────────────────────────────

@app.get("/agents")
async def get_agents():
    return [a.model_dump() for a in list_agents()]


@app.post("/agents")
async def create_agent(data: AgentCreate):
    agent = AgentConfig(**data.model_dump())
    save_agent(agent)
    return agent.model_dump()


@app.get("/agents/{agent_id}")
async def get_one_agent(agent_id: str):
    agent = get_agent(agent_id)
    if not agent:
        raise HTTPException(404, "Agent not found")
    return agent.model_dump()


@app.put("/agents/{agent_id}")
async def update_agent(agent_id: str, data: AgentCreate):
    existing = get_agent(agent_id)
    if not existing:
        raise HTTPException(404, "Agent not found")
    updated = AgentConfig(id=agent_id, **data.model_dump())
    save_agent(updated)
    return updated.model_dump()


@app.delete("/agents/{agent_id}")
async def remove_agent(agent_id: str):
    if not delete_agent(agent_id):
        raise HTTPException(404, "Agent not found")
    return {"deleted": agent_id}


@app.get("/agents/{agent_id}/a2a-card")
async def get_a2a_card(agent_id: str):
    agent = get_agent(agent_id)
    if not agent:
        raise HTTPException(404, "Agent not found")
    return {
        "name": agent.name,
        "description": agent.description,
        "url": f"http://localhost:8000/agents/{agent_id}",
        "version": agent.a2a_version,
        "skills": [
            {
                "id": t.name,
                "name": t.name,
                "description": t.description,
                "required_scopes": agent.scopes,
            }
            for t in agent.tools
        ],
        "required_scopes": agent.scopes,
    }


# ── Workflow Execution (SSE) ──────────────────────────────────────────────────

async def sse_stream(request: WorkflowRequest):
    async for event in run_workflow(request):
        yield f"data: {json.dumps(event)}\n\n"
        await asyncio.sleep(0.05)
    yield "data: [DONE]\n\n"


@app.post("/workflow/run")
async def run_workflow_endpoint(request: WorkflowRequest):
    return StreamingResponse(
        sse_stream(request),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ── Direct SemAuth Evaluation ─────────────────────────────────────────────────

@app.post("/semauth/evaluate")
async def evaluate_endpoint(req: EvalRequest):
    return evaluate(req.task, req.reasoning, req.agent_name, req.action)


@app.get("/health")
async def health():
    return {"status": "ok"}


# ── Scenarios ─────────────────────────────────────────────────────────────────

@app.get("/scenarios")
async def get_scenarios():
    """Returns built-in demo scenarios with resolved agent IDs."""
    all_agents = list_agents()
    agent_by_name = {a.name: a for a in all_agents}
    result = []
    for s in scenarios_module.get_all():
        agent_ids = [
            agent_by_name[name].id
            for name in s["agent_names"]
            if name in agent_by_name
        ]
        result.append({**s, "agent_ids": agent_ids})
    return result


@app.get("/scenarios/{scenario_id}")
async def get_scenario(scenario_id: str):
    s = scenarios_module.get_by_id(scenario_id)
    if not s:
        raise HTTPException(404, "Scenario not found")
    all_agents = list_agents()
    agent_by_name = {a.name: a for a in all_agents}
    agent_ids = [
        agent_by_name[name].id
        for name in s["agent_names"]
        if name in agent_by_name
    ]
    return {**s, "agent_ids": agent_ids}


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
