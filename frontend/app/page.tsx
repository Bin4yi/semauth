"use client";

import { useEffect, useState } from "react";
import { getAgents, Agent } from "@/lib/api";
import { Button } from "@/components/ui/button";
import WorkflowRunner from "@/components/WorkflowRunner";
import AgentForm from "@/components/AgentForm";

export default function HomePage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);

  async function load() {
    const data = await getAgents();
    setAgents(data);
  }

  useEffect(() => { load(); }, []);

  if (showNewForm || editingAgent) {
    return (
      <div className="flex justify-center pt-8">
        <AgentForm
          agent={editingAgent ?? undefined}
          onSave={() => { load(); setEditingAgent(null); setShowNewForm(false); }}
          onCancel={() => { setEditingAgent(null); setShowNewForm(false); }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Workflow Runner</h1>
        <p className="text-sm text-slate-500 mt-1">
          Select agents, set a task, optionally inject an attack per-agent, then run.
          SemAuth verifies full chain entailment at every hop.
        </p>
      </div>

      {agents.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <p className="text-slate-400 text-sm">No agents registered yet.</p>
          <Button onClick={() => setShowNewForm(true)}>
            Create your first agent
          </Button>
        </div>
      ) : (
        <WorkflowRunner
          agents={agents}
          onAgentsChange={load}
          onEditAgent={(a) => setEditingAgent(a)}
        />
      )}
    </div>
  );
}
