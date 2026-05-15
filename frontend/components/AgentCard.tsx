"use client";

import { motion } from "framer-motion";
import { Agent, deleteAgent } from "@/lib/api";
import { Edit2, Trash2, Shield, Wrench, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  agent: Agent;
  selected?: boolean;
  onSelect?: (id: string) => void;
  onEdit: (agent: Agent) => void;
  onDeleted: (id: string) => void;
}

export default function AgentCard({ agent, selected, onSelect, onEdit, onDeleted }: Props) {
  async function handleDelete() {
    if (!confirm(`Delete agent "${agent.name}"?`)) return;
    await deleteAgent(agent.id);
    onDeleted(agent.id);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      onClick={() => onSelect?.(agent.id)}
      className={cn(
        "group relative p-4 rounded-xl border transition-all duration-200",
        selected
          ? "border-zinc-900 bg-zinc-50 shadow-sm"
          : "border-zinc-200 bg-white hover:border-zinc-400 hover:shadow-sm",
        onSelect && "cursor-pointer"
      )}
    >
      {/* Selected indicator */}
      {selected && (
        <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-zinc-900" />
      )}

      <div className="space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center shrink-0">
              <Bot size={14} className="text-zinc-600" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-zinc-900 truncate">{agent.name}</h3>
              <p className="text-xs text-zinc-500 font-mono truncate">id: {agent.id.slice(0, 8)}…</p>
            </div>
          </div>

          {/* Action buttons — only visible on hover */}
          <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={(e) => { e.stopPropagation(); onEdit(agent); }}
            >
              <Edit2 size={12} />
            </Button>
            {/* Delete — critical: light red */}
            <Button
              size="icon"
              variant="destructive"
              className="h-7 w-7"
              onClick={(e) => { e.stopPropagation(); handleDelete(); }}
            >
              <Trash2 size={12} />
            </Button>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-zinc-500 leading-relaxed">{agent.description}</p>

        {/* Scopes */}
        {agent.scopes.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <Shield size={10} className="text-zinc-400 shrink-0" />
            {agent.scopes.map((s) => (
              <span
                key={s}
                className="px-2 py-0.5 text-xs rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200 font-mono"
              >
                {s}
              </span>
            ))}
          </div>
        )}

        {/* Tools */}
        {agent.tools.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <Wrench size={10} className="text-zinc-400 shrink-0" />
            {agent.tools.map((t) => (
              <span
                key={t.name}
                className="px-2 py-0.5 text-xs rounded-full bg-zinc-900 text-white font-mono"
              >
                {t.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
