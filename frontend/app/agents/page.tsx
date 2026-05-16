"use client";

import { useEffect, useState } from "react";
import { getAgents, Agent } from "@/lib/api";
import AgentCard from "@/components/AgentCard";
import AgentForm from "@/components/AgentForm";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [editing, setEditing] = useState<Agent | null>(null);
  const [creating, setCreating] = useState(false);

  async function load() {
    setAgents(await getAgents());
  }

  useEffect(() => { load(); }, []);

  if (creating || editing) {
    return (
      <div className="flex justify-center pt-8">
        <AgentForm
          agent={editing ?? undefined}
          onSave={() => { load(); setEditing(null); setCreating(false); }}
          onCancel={() => { setEditing(null); setCreating(false); }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Agent Registry</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Create and manage agents. Each agent has tools, scopes, and a system prompt.
          </p>
        </div>
        <Button onClick={() => setCreating(true)} className="gap-2">
          <Plus size={14} /> New Agent
        </Button>
      </div>

      {agents.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-zinc-400 text-sm">No agents yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onEdit={setEditing}
              onDeleted={(id) => setAgents((prev) => prev.filter((a) => a.id !== id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
