"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Agent, AgentTool, createAgent, updateAgent } from "@/lib/api";
import { Plus, Trash2, X, Bot, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  agent?: Agent;
  onSave: (agent: Agent) => void;
  onCancel: () => void;
}

const emptyTool = (): AgentTool => ({
  name: "",
  description: "",
  parameters: {},
  simulated_response: "",
});

const inputCls = cn(
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900",
  "placeholder:text-zinc-400",
  "focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1",
  "disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
);

const innerInputCls = cn(
  "w-full rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs text-zinc-900",
  "placeholder:text-zinc-400",
  "focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:ring-offset-0 transition-colors"
);

export default function AgentForm({ agent, onSave, onCancel }: Props) {
  const [name, setName] = useState(agent?.name ?? "");
  const [description, setDescription] = useState(agent?.description ?? "");
  const [systemPrompt, setSystemPrompt] = useState(agent?.system_prompt ?? "");
  const [scopesRaw, setScopesRaw] = useState((agent?.scopes ?? []).join(", "));
  const [tools, setTools] = useState<AgentTool[]>(agent?.tools ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toolParamKeys, setToolParamKeys] = useState<string[][]>(
    (agent?.tools ?? []).map((t) => Object.keys(t.parameters))
  );

  function addTool() {
    setTools([...tools, emptyTool()]);
    setToolParamKeys([...toolParamKeys, []]);
  }

  function removeTool(i: number) {
    setTools(tools.filter((_, idx) => idx !== i));
    setToolParamKeys(toolParamKeys.filter((_, idx) => idx !== i));
  }

  function updateTool(i: number, patch: Partial<AgentTool>) {
    setTools(tools.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));
  }

  function addParam(toolIdx: number) {
    const keys = [...toolParamKeys];
    keys[toolIdx] = [...keys[toolIdx], ""];
    setToolParamKeys(keys);
  }

  function updateParamKey(toolIdx: number, paramIdx: number, key: string) {
    const keys = [...toolParamKeys];
    const oldKey = keys[toolIdx][paramIdx];
    keys[toolIdx][paramIdx] = key;
    setToolParamKeys(keys);
    const params = { ...tools[toolIdx].parameters };
    const val = params[oldKey] ?? "";
    delete params[oldKey];
    params[key] = val;
    updateTool(toolIdx, { parameters: params });
  }

  function updateParamValue(toolIdx: number, key: string, value: string) {
    updateTool(toolIdx, { parameters: { ...tools[toolIdx].parameters, [key]: value } });
  }

  function removeParam(toolIdx: number, paramIdx: number) {
    const keys = [...toolParamKeys];
    const key = keys[toolIdx][paramIdx];
    keys[toolIdx] = keys[toolIdx].filter((_, i) => i !== paramIdx);
    setToolParamKeys(keys);
    const params = { ...tools[toolIdx].parameters };
    delete params[key];
    updateTool(toolIdx, { parameters: params });
  }

  async function handleSave() {
    if (!name.trim()) { setError("Name is required"); return; }
    setSaving(true);
    setError("");
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        system_prompt: systemPrompt.trim(),
        scopes: scopesRaw.split(",").map((s) => s.trim()).filter(Boolean),
        tools,
        can_delegate_to: agent?.can_delegate_to ?? [],
      };
      const saved = agent ? await updateAgent(agent.id, payload) : await createAgent(payload);
      onSave(saved);
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="bg-white border border-zinc-200 rounded-xl shadow-sm max-w-2xl w-full overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center">
            <Bot size={14} className="text-zinc-600" />
          </div>
          <h2 className="text-sm font-semibold text-zinc-900">
            {agent ? "Edit Agent" : "New Agent"}
          </h2>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onCancel}>
          <X size={14} />
        </Button>
      </div>

      <div className="px-6 py-5 space-y-5 max-h-[80vh] overflow-y-auto">
        {/* Error banner */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
            <AlertCircle size={14} className="shrink-0" />
            {error}
          </div>
        )}

        {/* Core fields */}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-1.5">
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
              placeholder="HR Agent"
            />
          </div>

          <div className="col-span-2 space-y-1.5">
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Description</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputCls}
              placeholder="Manages employee profiles and HR operations"
            />
          </div>

          <div className="col-span-2 space-y-1.5">
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">System Prompt</label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={4}
              className={cn(inputCls, "resize-none rounded-xl bg-zinc-50")}
              placeholder="You are an HR assistant. Only perform actions explicitly requested..."
            />
          </div>

          <div className="col-span-2 space-y-1.5">
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">OAuth Scopes</label>
            <input
              value={scopesRaw}
              onChange={(e) => setScopesRaw(e.target.value)}
              className={inputCls}
              placeholder="hr:read, hr:write"
            />
            <p className="text-xs text-zinc-400">Comma-separated scope identifiers</p>
          </div>
        </div>

        {/* Tools */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Tools</label>
            <Button variant="outline" size="sm" onClick={addTool} className="h-7 text-xs gap-1">
              <Plus size={11} /> Add Tool
            </Button>
          </div>

          {tools.length === 0 && (
            <p className="text-xs text-zinc-400 text-center py-4 border-2 border-dashed border-zinc-200 rounded-xl">
              No tools yet — add a tool to give this agent capabilities
            </p>
          )}

          {tools.map((tool, ti) => (
            <motion.div
              key={ti}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-zinc-600">
                  Tool {ti + 1}
                </span>
                {/* Remove tool — critical: light red */}
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => removeTool(ti)}
                >
                  <Trash2 size={11} />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-zinc-500">Function name</label>
                  <input
                    value={tool.name}
                    onChange={(e) => updateTool(ti, { name: e.target.value })}
                    className={innerInputCls}
                    placeholder="send_email"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-zinc-500">Description</label>
                  <input
                    value={tool.description}
                    onChange={(e) => updateTool(ti, { description: e.target.value })}
                    className={innerInputCls}
                    placeholder="Send an email to a recipient"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-xs text-zinc-500">Simulated response</label>
                  <input
                    value={tool.simulated_response}
                    onChange={(e) => updateTool(ti, { simulated_response: e.target.value })}
                    className={innerInputCls}
                    placeholder="Email sent to {to}. Use {param} for placeholders."
                  />
                </div>
              </div>

              {/* Parameters */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-zinc-500">Parameters</label>
                  <button
                    onClick={() => addParam(ti)}
                    className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
                  >
                    + add param
                  </button>
                </div>
                {(toolParamKeys[ti] ?? []).map((key, pi) => (
                  <div key={pi} className="flex gap-2 items-center">
                    <input
                      value={key}
                      onChange={(e) => updateParamKey(ti, pi, e.target.value)}
                      className="w-28 rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                      placeholder="param_name"
                    />
                    <input
                      value={tool.parameters[key] ?? ""}
                      onChange={(e) => updateParamValue(ti, key, e.target.value)}
                      className="flex-1 rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                      placeholder="description"
                    />
                    {/* Remove param — critical: light red */}
                    <button
                      onClick={() => removeParam(ti, pi)}
                      className="p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex gap-3 justify-end px-6 py-4 border-t border-zinc-100 bg-zinc-50/50">
        {/* Cancel — outline (white bg, black border) */}
        <Button variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        {/* Save — default (black) */}
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : agent ? "Update Agent" : "Create Agent"}
        </Button>
      </div>
    </motion.div>
  );
}
