const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export interface AgentTool {
  name: string;
  description: string;
  parameters: Record<string, string>;
  simulated_response: string;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  system_prompt: string;
  scopes: string[];
  tools: AgentTool[];
  can_delegate_to: string[];
}

export interface WorkflowRequest {
  task: string;
  agent_ids: string[];
  inject?: string;  // legacy global
  agent_injections?: Record<string, string>;  // agent_id -> injection
}

export async function getAgents(): Promise<Agent[]> {
  const r = await fetch(`${BASE}/agents`);
  return r.json();
}

export async function createAgent(data: Omit<Agent, "id">): Promise<Agent> {
  const r = await fetch(`${BASE}/agents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return r.json();
}

export async function updateAgent(id: string, data: Omit<Agent, "id">): Promise<Agent> {
  const r = await fetch(`${BASE}/agents/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return r.json();
}

export async function deleteAgent(id: string): Promise<void> {
  await fetch(`${BASE}/agents/${id}`, { method: "DELETE" });
}

export async function getA2ACard(id: string): Promise<Record<string, unknown>> {
  const r = await fetch(`${BASE}/agents/${id}/a2a-card`);
  return r.json();
}

export function runWorkflow(
  request: WorkflowRequest,
  onEvent: (event: Record<string, unknown>) => void,
  onDone: () => void,
): AbortController {
  const controller = new AbortController();

  fetch(`${BASE}/workflow/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
    signal: controller.signal,
  }).then(async (res) => {
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6).trim();
          if (data === "[DONE]") {
            onDone();
            return;
          }
          try {
            onEvent(JSON.parse(data));
          } catch {
            // ignore malformed SSE
          }
        }
      }
    }
    onDone();
  }).catch((err) => {
    if (err.name !== "AbortError") console.error("SSE error:", err);
    onDone();
  });

  return controller;
}
