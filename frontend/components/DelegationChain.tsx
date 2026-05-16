"use client";

import { CheckCircle, XCircle, ArrowRight } from "lucide-react";
import clsx from "clsx";

interface Hop {
  agent_id: string;
  agent_name: string;
  scopes: string[];
  semauth_passed: boolean;
  cvic_class: string | null;
}

interface Props {
  hops: Hop[];
}

export default function DelegationChain({ hops }: Props) {
  if (hops.length === 0) {
    return (
      <div className="text-zinc-400 text-xs flex items-center justify-center h-16">
        No delegation hops yet
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 flex-wrap py-2">
      {/* User origin */}
      <div className="flex flex-col items-center gap-1">
        <div className="w-9 h-9 rounded-full bg-zinc-100 border border-zinc-300 flex items-center justify-center text-xs text-zinc-600 font-semibold">
          U
        </div>
        <span className="text-xs text-zinc-400">User</span>
      </div>

      {hops.map((hop, i) => (
        <div key={i} className="flex items-start gap-2">
          <div className="flex flex-col items-center mt-1.5">
            <ArrowRight size={14} className="text-zinc-400" />
            <span className="text-xs text-zinc-400 font-mono mt-0.5">act</span>
          </div>

          <div
            className={clsx(
              "flex flex-col items-center gap-1.5 rounded-lg border px-3 py-2.5 min-w-28",
              hop.semauth_passed
                ? "border-green-300 bg-green-50"
                : "border-red-300 bg-red-50"
            )}
          >
            <div className="flex items-center gap-1.5">
              {hop.semauth_passed ? (
                <CheckCircle size={13} className="text-green-500" />
              ) : (
                <XCircle size={13} className="text-red-500" />
              )}
              <span className="text-xs text-zinc-800 font-semibold">{hop.agent_name}</span>
            </div>
            <div className="flex gap-1 flex-wrap justify-center">
              {hop.scopes.map((s) => (
                <span key={s} className="text-xs font-mono text-zinc-500 bg-white border border-zinc-200 px-1 rounded">
                  {s}
                </span>
              ))}
            </div>
            {hop.cvic_class && (
              <span className="text-xs text-red-600 font-mono text-center leading-tight">
                {hop.cvic_class}
              </span>
            )}
            <span className="text-xs text-zinc-400 font-mono">{hop.agent_id}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
