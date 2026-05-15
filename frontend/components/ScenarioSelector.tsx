"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { Zap, Shield, ChevronDown, ChevronUp } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export interface Scenario {
  id: string;
  title: string;
  description: string;
  task: string;
  inject: string | null;
  agent_ids: string[];
  agent_names: string[];
  cvic_class: string | null;
  cvic_class_number: number | null;
  tag: "ATTACK" | "CLEAN";
  highlights: string[];
}

interface Props {
  onLoad: (scenario: Scenario) => void;
}

export default function ScenarioSelector({ onLoad }: Props) {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${BASE}/scenarios`).then((r) => r.json()).then(setScenarios).catch(() => {});
  }, []);

  if (scenarios.length === 0) return null;

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
      <button
        onClick={() => setOpen((s) => !s)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-violet-500" />
          <span className="text-sm font-semibold text-slate-700">Load a demo scenario</span>
          <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{scenarios.length}</span>
        </div>
        {open
          ? <ChevronUp size={14} className="text-slate-400" />
          : <ChevronDown size={14} className="text-slate-400" />
        }
      </button>

      {open && (
        <div className="divide-y divide-slate-100 border-t border-slate-200">
          {scenarios.map((s) => (
            <div key={s.id} className="bg-white hover:bg-slate-50 transition-colors">
              <div className="flex items-start gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={clsx(
                      "text-xs font-bold px-1.5 py-0.5 rounded",
                      s.tag === "ATTACK"
                        ? "bg-red-100 text-red-700 border border-red-200"
                        : "bg-green-100 text-green-700 border border-green-200"
                    )}>
                      {s.tag}
                    </span>
                    <span className="text-sm text-slate-800 font-semibold">{s.title}</span>
                    {s.cvic_class && (
                      <span className="text-xs text-orange-600 font-mono bg-orange-50 px-1 rounded">
                        CVIC {s.cvic_class_number}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{s.description}</p>
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <Shield size={10} className="text-slate-400" />
                    {s.agent_names.map((n) => (
                      <span key={n} className="text-xs text-slate-500 font-mono bg-slate-100 px-1 rounded border border-slate-200">
                        {n}
                      </span>
                    ))}
                  </div>

                  {expanded === s.id && (
                    <div className="mt-3 space-y-2">
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                        <p className="text-xs text-slate-500 font-semibold mb-1">Task</p>
                        <p className="text-xs text-slate-700">{s.task}</p>
                      </div>
                      {s.inject && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                          <p className="text-xs text-orange-600 font-semibold mb-1">Injection (→ first agent)</p>
                          <p className="text-xs text-orange-800">{s.inject}</p>
                        </div>
                      )}
                      <div className="space-y-1">
                        <p className="text-xs text-slate-500 font-semibold">What to watch for:</p>
                        {s.highlights.map((h, i) => (
                          <div key={i} className="flex gap-1.5 text-xs text-slate-600">
                            <span className="text-violet-500 shrink-0">→</span>
                            {h}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => { onLoad(s); setOpen(false); }}
                    className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs rounded-lg font-semibold"
                  >
                    Load
                  </button>
                  <button
                    onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                    className="px-3 py-1.5 border border-slate-300 text-slate-500 hover:text-slate-700 text-xs rounded-lg"
                  >
                    {expanded === s.id ? "Hide" : "Details"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
