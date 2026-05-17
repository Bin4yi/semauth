"use client";

import { cn } from "@/lib/utils";
import {
  CheckCircle, XCircle, AlertTriangle, Cpu, Shield,
  Key, ArrowRight, Loader2, GitBranch,
} from "lucide-react";

interface Props {
  events: Record<string, unknown>[];
}

function ChainChecks({ chain }: { chain: Record<string, unknown> }) {
  const checks = [
    { key: "check_1", label: "task → mandate" },
    { key: "check_2", label: "mandate → output" },
    { key: "check_3", label: "output → next mandate" },
    { key: "check_4", label: "mandate → reasoning" },
  ];
  return (
    <div className="grid grid-cols-2 gap-1 mt-2">
      {checks.map(({ key, label }) => {
        const check = (chain[key] as Record<string, unknown>) ?? {};
        const passed = check.passed as boolean;
        return (
          <div key={key} className="flex items-start gap-1.5">
            {passed
              ? <CheckCircle size={11} className="text-green-500 mt-0.5 shrink-0" />
              : <XCircle size={11} className="text-red-500 mt-0.5 shrink-0" />
            }
            <div>
              <span className={cn("text-xs font-mono", passed ? "text-zinc-500" : "text-red-600 font-medium")}>
                {label}
              </span>
              {!passed && (
                <p className="text-xs text-red-500 leading-tight">{String(check.reason ?? "")}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EventRow({ event }: { event: Record<string, unknown> }) {
  const type = event.type as string;
  const data = (event.data ?? {}) as Record<string, unknown>;

  switch (type) {
    case "workflow_start":
      return (
        <div className="flex gap-3 items-start py-2.5 border-b border-zinc-100">
          <ArrowRight size={14} className="text-zinc-400 mt-0.5 shrink-0" />
          <div>
            <span className="text-xs text-zinc-700 font-semibold">Workflow started</span>
            <p className="text-xs text-zinc-500 mt-0.5">Task: {String(data.task)}</p>
            {!!data.injection && (
              <p className="text-xs text-red-600 mt-0.5 font-medium font-mono">
                Injection active: {String(data.injection)}
              </p>
            )}
          </div>
        </div>
      );

    case "agent_start":
      return (
        <div className="flex gap-3 items-center py-2.5 border-b border-zinc-100">
          <Cpu size={14} className="text-zinc-500 shrink-0" />
          <span className="text-xs text-zinc-700 font-semibold">
            Executing {String(data.agent_name)}
          </span>
        </div>
      );

    case "mandate_derived":
      return (
        <div className="flex gap-3 items-start py-2.5 border-b border-zinc-100">
          <GitBranch size={14} className="text-cyan-600 mt-0.5 shrink-0" />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-cyan-700 font-semibold">Mandate derived</span>
              <span className="text-xs text-zinc-400 font-mono">
                depth={String(data.mandate_depth)} from={String(data.derived_from)}
              </span>
            </div>
            <p className="text-xs text-cyan-800 mt-0.5 pl-2 border-l-2 border-cyan-200">
              {String(data.mandate)}
            </p>
          </div>
        </div>
      );

    case "agent_reasoning": {
      const steps = (data.reasoning_steps as string[]) ?? [];
      const calls = (data.tool_calls as Record<string, unknown>[]) ?? [];
      return (
        <div className="flex gap-3 items-start py-2.5 border-b border-zinc-100">
          <Cpu size={14} className="text-zinc-400 mt-0.5 shrink-0" />
          <div className="space-y-1 w-full">
            <span className="text-xs text-zinc-500 font-semibold">{String(data.agent_name)} reasoning</span>
            {steps.map((s, i) => (
              <p key={i} className="text-xs text-zinc-500 leading-relaxed pl-2 border-l-2 border-zinc-100">
                {s.length > 300 ? s.slice(0, 300) + "…" : s}
              </p>
            ))}
            {calls.map((tc, i) => (
              <div key={i} className="text-xs font-mono pl-2 flex gap-1.5 items-baseline">
                <span className="text-zinc-900 font-semibold">{String(tc.tool)}</span>
                <span className="text-zinc-400">→</span>
                <span className="text-zinc-500">{String(tc.result).slice(0, 100)}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case "semauth_evaluating":
      return (
        <div className="flex gap-3 items-center py-2.5 border-b border-zinc-100">
          <Loader2 size={14} className="text-amber-500 animate-spin shrink-0" />
          <span className="text-xs text-amber-700 font-semibold">
            SemAuth (3 layers) evaluating {String(data.agent_name)}…
          </span>
        </div>
      );

    case "semauth_verdict": {
      const v = (data.verdict as Record<string, unknown>) ?? {};
      const cvic = (v.cvic as Record<string, unknown>) ?? {};
      const chain = (v.chain as Record<string, unknown>) ?? {};
      const gap = v.entailment_gap_demonstrated as boolean;
      const simScore = Number(v.similarity_score);
      const simPassed = simScore >= 0.75;
      // Entailment Gap: similarity said PASS but CVIC/chain caught the attack
      const simBlindspot = simPassed && (cvic.detected || !chain.all_passed);
      return (
        <div className="flex gap-3 items-start py-2.5 border-b border-zinc-100">
          <Shield size={14} className="text-blue-500 mt-0.5 shrink-0" />
          <div className="space-y-1.5 w-full">
            <span className="text-xs text-blue-700 font-semibold">SemAuth 3-layer verdict</span>
            <div className="flex gap-2 text-xs flex-wrap items-center">
              {/* L1 — show "WOULD HAVE PASSED" warning when it's a blind spot */}
              <div className="flex items-center gap-1">
                <span className={cn(
                  "font-mono font-semibold px-2 py-0.5 rounded-full border",
                  simBlindspot
                    ? "bg-amber-50 text-amber-700 border-amber-300"
                    : simPassed
                      ? "bg-zinc-100 text-zinc-700 border-zinc-200"
                      : "bg-red-100 text-red-600 border-red-200"
                )}>
                  L1 sim={String(v.similarity_score)}
                </span>
                {simBlindspot && (
                  <span className="text-xs font-bold text-amber-700 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full uppercase tracking-wide">
                    ⚠ Would have passed
                  </span>
                )}
              </div>
              <span className={cn(
                "font-mono font-semibold px-2 py-0.5 rounded-full border",
                cvic.detected
                  ? "bg-red-100 text-red-600 border-red-200"
                  : "bg-zinc-100 text-zinc-700 border-zinc-200"
              )}>
                L2 cvic={cvic.detected ? "DETECTED" : "CLEAN"}
              </span>
              <span className={cn(
                "font-mono font-semibold px-2 py-0.5 rounded-full border",
                chain.all_passed
                  ? "bg-zinc-100 text-zinc-700 border-zinc-200"
                  : "bg-red-100 text-red-600 border-red-200"
              )}>
                L3 chain={chain.all_passed ? "VALID" : "BROKEN"}
              </span>
            </div>
            <ChainChecks chain={chain} />
            {gap && (
              <div className="mt-1 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 space-y-0.5">
                <p className="text-xs text-amber-800 font-bold">Entailment Gap demonstrated</p>
                <p className="text-xs text-amber-700">
                  Cosine similarity scored <span className="font-mono font-semibold">{simScore.toFixed(4)}</span> — above the pass threshold.
                  A similarity-only gate would have <span className="font-semibold">issued the token and allowed the attack.</span>
                </p>
                {!!cvic.similarity_would_miss && (
                  <p className="text-xs text-amber-600 italic mt-0.5">{String(cvic.similarity_would_miss)}</p>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    case "semauth_blocked": {
      const chain = (data.chain_checks as Record<string, unknown>) ?? {};
      return (
        <div className="flex gap-3 items-start py-2.5 border-b border-zinc-100 bg-red-50 border border-red-100 rounded-xl px-3 my-1.5">
          <XCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-red-700 font-bold">BLOCKED — {String(data.agent_name)}</span>
              <span className="text-xs bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-mono font-semibold">
                {String(data.blocked_by)}
              </span>
            </div>
            {!!data.cvic_class && (
              <p className="text-xs text-red-600 font-medium">
                CVIC: <span className="font-mono">{String(data.cvic_class)}</span>{" "}
                <span className="text-zinc-500">(conf {String(data.cvic_confidence)})</span>
              </p>
            )}
            {!!data.cvic_reason && <p className="text-xs text-zinc-600">{String(data.cvic_reason)}</p>}
            {!!data.weakest_link && (
              <p className="text-xs text-red-600 font-mono">Chain broken at: {String(data.weakest_link)}</p>
            )}
            {!!data.similarity_would_miss && (
              <p className="text-xs text-zinc-500 italic">Why similarity missed: {String(data.similarity_would_miss)}</p>
            )}
            <ChainChecks chain={chain} />
            {(data.downstream_protected as string[])?.length > 0 && (
              <p className="text-xs text-zinc-500">
                Downstream protected: {(data.downstream_protected as string[]).join(", ")}
              </p>
            )}
          </div>
        </div>
      );
    }

    case "token_issued": {
      const claims = (data.jwt_claims as Record<string, unknown>) ?? {};
      return (
        <div className="flex gap-3 items-start py-2.5 border-b border-zinc-100 bg-zinc-50 border border-zinc-200 rounded-xl px-3 my-1.5">
          <Key size={14} className="text-zinc-600 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <span className="text-xs text-zinc-800 font-bold">JWT issued — {String(data.agent_name)}</span>
            <div className="flex gap-2 text-xs font-mono flex-wrap">
              <span className="text-zinc-500">scope: {String(claims.scope)}</span>
              <span className="text-zinc-800 font-semibold">ii_verified: true</span>
              <span className="text-zinc-800 font-semibold">ii_chain_valid: {String(claims.ii_chain_valid)}</span>
              <span className="text-zinc-500">depth: {String(data.act_chain_depth)}</span>
            </div>
            {!!claims.mandate && (
              <p className="text-xs text-cyan-700 font-mono">mandate: {String(claims.mandate).slice(0, 120)}</p>
            )}
          </div>
        </div>
      );
    }

    case "agent_complete":
      return (
        <div className="flex gap-3 items-start py-2.5 border-b border-zinc-100">
          <CheckCircle size={14} className="text-green-500 mt-0.5 shrink-0" />
          <div>
            <span className="text-xs text-zinc-700 font-semibold">{String(data.agent_name)} completed</span>
            <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
              {String(data.result).slice(0, 200)}
            </p>
          </div>
        </div>
      );

    case "workflow_complete":
      return (
        <div className="flex gap-3 items-center py-2.5 bg-zinc-900 rounded-xl px-3 my-1">
          <CheckCircle size={14} className="text-white shrink-0" />
          <span className="text-xs text-white font-bold">
            Workflow complete — full chain entailment verified at every hop
          </span>
        </div>
      );

    case "workflow_blocked":
      return (
        <div className="flex gap-3 items-center py-2.5 bg-red-600 rounded-xl px-3 my-1">
          <XCircle size={14} className="text-white shrink-0" />
          <span className="text-xs text-white font-bold">
            Workflow blocked at {String(data.blocked_at)} — delegation chain terminated
          </span>
        </div>
      );

    case "error":
      return (
        <div className="flex gap-3 items-center py-2.5">
          <AlertTriangle size={14} className="text-amber-500 shrink-0" />
          <span className="text-xs text-amber-700">{String(data.message)}</span>
        </div>
      );

    default:
      return null;
  }
}

export default function EventFeed({ events }: Props) {
  if (events.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-zinc-400 text-sm">
        Run a workflow to see events
      </div>
    );
  }
  return (
    <div className="space-y-0">
      {events.map((e, i) => <EventRow key={i} event={e} />)}
    </div>
  );
}
