"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
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
    <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white shadow-sm">
      {/* Toggle header */}
      <button
        onClick={() => setOpen((s) => !s)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Zap size={13} className="text-zinc-500" />
          <span className="text-sm font-semibold text-zinc-700">Load a demo scenario</span>
          <span className="text-xs text-zinc-500 bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded-full font-medium">
            {scenarios.length}
          </span>
        </div>
        {open
          ? <ChevronUp size={14} className="text-zinc-400" />
          : <ChevronDown size={14} className="text-zinc-400" />
        }
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-zinc-200"
          >
            <div className="divide-y divide-zinc-100">
              {scenarios.map((s) => (
                <div key={s.id} className="bg-white hover:bg-zinc-50 transition-colors">
                  <div className="flex items-start gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      {/* Title row */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn(
                          "text-xs font-bold px-2 py-0.5 rounded-full border",
                          s.tag === "ATTACK"
                            ? "bg-red-100 text-red-700 border-red-200"
                            : "bg-zinc-100 text-zinc-600 border-zinc-200"
                        )}>
                          {s.tag}
                        </span>
                        <span className="text-sm text-zinc-900 font-semibold">{s.title}</span>
                        {s.cvic_class && (
                          <span className="text-xs text-red-600 font-mono bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                            CVIC {s.cvic_class_number}
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{s.description}</p>

                      {/* Agent chain */}
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <Shield size={10} className="text-zinc-400" />
                        {s.agent_names.map((n) => (
                          <span key={n} className="px-2 py-0.5 text-xs rounded-full bg-zinc-100 text-zinc-500 font-mono border border-zinc-200">
                            {n}
                          </span>
                        ))}
                      </div>

                      {/* Expanded details */}
                      <AnimatePresence>
                        {expanded === s.id && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.15 }}
                            className="mt-3 space-y-2"
                          >
                            <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-2.5">
                              <p className="text-xs text-zinc-500 font-semibold mb-1">Task</p>
                              <p className="text-xs text-zinc-700">{s.task}</p>
                            </div>
                            {s.inject && (
                              <div className="bg-red-50 border border-red-200 rounded-lg p-2.5">
                                <p className="text-xs text-red-600 font-semibold mb-1">Injection → first agent</p>
                                <p className="text-xs text-red-800 font-mono">{s.inject}</p>
                              </div>
                            )}
                            <div className="space-y-1.5">
                              <p className="text-xs text-zinc-500 font-semibold">What to watch for:</p>
                              {s.highlights.map((h, i) => (
                                <div key={i} className="flex gap-1.5 text-xs text-zinc-600">
                                  <span className="text-zinc-400 shrink-0">→</span>
                                  {h}
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <button
                        onClick={() => { onLoad(s); setOpen(false); }}
                        className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-700 text-white text-xs rounded-lg font-semibold transition-colors"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                        className="px-3 py-1.5 border border-zinc-200 text-zinc-500 hover:text-zinc-800 hover:border-zinc-400 text-xs rounded-lg transition-colors"
                      >
                        {expanded === s.id ? "Hide" : "Details"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
