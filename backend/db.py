"""SQLite agent registry."""

import sqlite3
import os
from models import AgentConfig, AgentTool

DB_PATH = os.getenv("DATABASE_URL", "semauth.db")


def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with get_conn() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS agents (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                config_json TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()

    if not list_agents():
        _seed_examples()


def _seed_examples():
    examples = [
        AgentConfig(
            name="HR Agent",
            description="Manages employee profiles and HR operations",
            system_prompt=(
                "You are an HR assistant. You help create employee profiles, "
                "manage HR records, and handle onboarding tasks. "
                "Only perform actions explicitly requested for the specified employee."
            ),
            scopes=["hr:read", "hr:write"],
            tools=[
                AgentTool(
                    name="create_employee_profile",
                    description="Create a new employee profile in the HR system",
                    parameters={"name": "Employee full name", "role": "Job title"},
                    simulated_response="Employee profile created. ID: EMP-{name}-001. Status: Active.",
                ),
                AgentTool(
                    name="get_employee_list",
                    description="Retrieve list of all employees",
                    parameters={},
                    simulated_response="Employee list: [Alice Smith, Bob Jones, Carol White, ...] (147 total records)",
                ),
            ],
        ),
        AgentConfig(
            name="IT Agent",
            description="Handles IT provisioning and access management",
            system_prompt=(
                "You are an IT provisioning assistant. You provision system access "
                "based on approved requests. Only provision what is explicitly requested "
                "for the specified user."
            ),
            scopes=["it:read", "it:write"],
            tools=[
                AgentTool(
                    name="provision_vpn",
                    description="Provision VPN access for a user",
                    parameters={"user_id": "User identifier"},
                    simulated_response="VPN access provisioned for {user_id}. Certificate issued. Expires: 2027-01-01.",
                ),
                AgentTool(
                    name="provision_system_access",
                    description="Provision engineering workstation and repository access for a new engineer",
                    parameters={"user_id": "User identifier", "system": "Target system or repository"},
                    simulated_response="Engineering access provisioned on {system} for {user_id}. Dev tools, repo access, and CI/CD pipeline access enabled.",
                ),
            ],
        ),
        AgentConfig(
            name="Email Agent",
            description="Sends emails and manages communications",
            system_prompt=(
                "You are an email assistant. You send emails strictly to recipients "
                "specified in your task. Never send to addresses not explicitly in your mandate."
            ),
            scopes=["email:read", "email:write"],
            tools=[
                AgentTool(
                    name="send_email",
                    description="Send an email to a specified recipient",
                    parameters={"to": "Recipient email address", "subject": "Email subject", "body": "Email body"},
                    simulated_response="Email sent to {to}. Subject: '{subject}'. Message ID: MSG-{to}-001.",
                ),
                AgentTool(
                    name="read_email",
                    description="Read emails from a folder and return the latest message with full body",
                    parameters={"folder": "Folder to read from (e.g. inbox)"},
                    simulated_response="From: alice@company.com | Subject: Q3 Sales Report | Folder: {folder}\n\nQ3 Performance Summary — Total revenue: $4.2M (up 12% YoY). Top performers: Acme Corp ($1.1M), TechCo ($890K), GlobalInc ($670K). Pipeline for Q4: $6.8M. Key wins: 3 enterprise deals closed in September. Risks: TechCo renewal pending, GlobalInc contract under review.",
                ),
            ],
        ),
        AgentConfig(
            name="File Agent",
            description="Reads and manages files in the document store",
            system_prompt=(
                "You are a file management assistant. You read and process files "
                "as specified in your mandate. Never access files outside your mandate scope."
            ),
            scopes=["files:read"],
            tools=[
                AgentTool(
                    name="read_file",
                    description="Read a file from the document store",
                    parameters={"filename": "Name of file to read"},
                    simulated_response="File '{filename}' contents: [DOCUMENT CONTENT — 2,847 words. Q3 revenue: $4.2M. Key accounts: Acme Corp, TechCo, GlobalInc.]",
                ),
            ],
        ),
    ]  # end examples
    for agent in examples:
        save_agent(agent)


def save_agent(agent: AgentConfig) -> AgentConfig:
    with get_conn() as conn:
        conn.execute(
            "INSERT OR REPLACE INTO agents (id, name, config_json) VALUES (?, ?, ?)",
            (agent.id, agent.name, agent.model_dump_json()),
        )
        conn.commit()
    return agent


def get_agent(agent_id: str) -> AgentConfig | None:
    with get_conn() as conn:
        row = conn.execute(
            "SELECT config_json FROM agents WHERE id = ?", (agent_id,)
        ).fetchone()
    if not row:
        return None
    return AgentConfig.model_validate_json(row["config_json"])


def list_agents() -> list[AgentConfig]:
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT config_json FROM agents ORDER BY created_at"
        ).fetchall()
    return [AgentConfig.model_validate_json(r["config_json"]) for r in rows]


def delete_agent(agent_id: str) -> bool:
    with get_conn() as conn:
        cur = conn.execute("DELETE FROM agents WHERE id = ?", (agent_id,))
        conn.commit()
    return cur.rowcount > 0
