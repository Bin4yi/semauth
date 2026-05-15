"use client";

import clsx from "clsx";
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
              <span className={clsx("text-xs font-mono", passed ? "text-slate-500" : "text-red-600 font-medium")}>
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
        <div className="flex gap-3 items-start py-2.5 border-b border-slate-100">
          <ArrowRight size={14} className="text-slate-400 mt-0.5 shrink-0" />
          <div>
            <span className="text-xs text-slate-700 font-semibold">Workflow started</span>
            <p className="text-xs text-slate-500 mt-0.5">Task: {String(data.task)}</p>
            {!!data.injection && (
              <p className="text-xs text-orange-600 mt-0.5 font-medium">
                Injection active: <span className="font-mono">{String(data.injection)}</span>
              </p>
            )}
          </div>
        </div>
      );

    case "agent_start":
      return (
        <div className="flex gap-3 items-center py-2.5 border-b border-slate-100">
          <Cpu size={14} className="text-violet-500 shrink-0" />
          <span className="text-xs text-violet-700 font-semibold">
            Executing {String(data.agent_name)}
          </span>
        </div>
      );

    case "mandate_derived":
      return (
        <div className="flex gap-3 items-start py-2.5 border-b border-slate-100">
          <GitBranch size={14} className="text-cyan-600 mt-0.5 shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-cyan-700 font-semibold">Mandate derived</span>
              <span className="text-xs text-slate-400 font-mono">
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
        <div className="flex gap-3 items-start py-2.5 border-b border-slate-100">
          <Cpu size={14} className="text-slate-400 mt-0.5 shrink-0" />
          <div className="space-y-1 w-full">
            <span className="text-xs text-slate-500 font-semibold">{String(data.agent_name)} reasoning</span>
            {steps.map((s, i) => (
              <p key={i} className="text-xs text-slate-500 leading-relaxed pl-2 border-l-2 border-slate-100">
                {s.length > 300 ? s.slice(0, 300) + "…" : s}
              </p>
            ))}
            {calls.map((tc, i) => (
              <div key={i} className="text-xs font-mono pl-2">
                <span className="text-violet-600">{String(tc.tool)}</span>
                {" → "}
                <span className="text-slate-500">{String(tc.result).slice(0, 100)}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case "semauth_evaluating":
      return (
        <div className="flex gap-3 items-center py-2.5 border-b border-slate-100">
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
      return (
        <div className="flex gap-3 items-start py-2.5 border-b border-slate-100">
          <Shield size={14} className="text-blue-500 mt-0.5 shrink-0" />
          <div className="space-y-1.5 w-full">
            <span className="text-xs text-blue-700 font-semibold">SemAuth 3-layer verdict</span>
            <div className="flex gap-3 text-xs flex-wrap">
              <span className={clsx("font-mono font-semibold px-1.5 py-0.5 rounded", simScore >= 0.75 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600")}>
                L1 sim={String(v.similarity_score)}
              </span>
              <span className={clsx("font-mono font-semibold px-1.5 py-0.5 rounded", cvic.detected ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700")}>
                L2 cvic={cvic.detected ? "DETECTED" : "CLEAN"}
              </span>
              <span className={clsx("font-mono font-semibold px-1.5 py-0.5 rounded", chain.all_passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600")}>
                L3 chain={chain.all_passed ? "VALID" : "BROKEN"}
              </span>
            </div>
            <ChainChecks chain={chain} />
            {gap && (
              <p className="text-xs text-orange-600 font-semibold bg-orange-50 border border-orange-200 rounded px-2 py-1 mt-1">
                Entailment Gap — L1 similarity passed but L2/L3 caught the attack
              </p>
            )}
          </div>
        </div>
      );
    }

    case "semauth_blocked": {
      const chain = (data.chain_checks as Record<string, unknown>) ?? {};
      return (
        <div className="flex gap-3 items-start py-2.5 border-b border-slate-100 bg-red-50 rounded-lg px-2 my-1">
          <XCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-red-700 font-bold">BLOCKED — {String(data.agent_name)}</span>
              <span className="text-xs bg-red-100 text-red-700 border border-red-200 px-1.5 py-0.5 rounded font-mono">
                {String(data.blocked_by)}
              </span>
            </div>
            {!!data.cvic_class && (
              <p className="text-xs text-red-600 font-medium">
                CVIC: <span className="font-mono">{String(data.cvic_class)}</span>{" "}
                (conf {String(data.cvic_confidence)})
              </p>
            )}
            {!!data.cvic_reason && <p className="text-xs text-slate-600">{String(data.cvic_reason)}</p>}
            {!!data.weakest_link && (
              <p className="text-xs text-orange-600 font-mono">Chain broken at: {String(data.weakest_link)}</p>
            )}
            {!!data.similarity_would_miss && (
              <p className="text-xs text-orange-600 italic">Why similarity missed: {String(data.similarity_would_miss)}</p>
            )}
            <ChainChecks chain={chain} />
            {(data.downstream_protected as string[])?.length > 0 && (
              <p className="text-xs text-slate-500">
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
        <div className="flex gap-3 items-start py-2.5 border-b border-slate-100 bg-green-50 rounded-lg px-2 my-1">
          <Key size={14} className="text-green-600 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <span className="text-xs text-green-700 font-bold">JWT issued — {String(data.agent_name)}</span>
            <div className="flex gap-2 text-xs font-mono flex-wrap">
              <span className="text-slate-500">scope: {String(claims.scope)}</span>
              <span className="text-green-700 font-semibold">ii_verified: true</span>
              <span className="text-green-700 font-semibold">ii_chain_valid: {String(claims.ii_chain_valid)}</span>
              <span className="text-slate-500">depth: {String(data.act_chain_depth)}</span>
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
        <div className="flex gap-3 items-start py-2.5 border-b border-slate-100">
          <CheckCircle size={14} className="text-green-500 mt-0.5 shrink-0" />
          <div>
            <span className="text-xs text-green-700 font-semibold">{String(data.agent_name)} completed</span>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              {String(data.result).slice(0, 200)}
            </p>
          </div>
        </div>
      );

    case "workflow_complete":
      return (
        <div className="flex gap-3 items-center py-2.5 bg-green-50 rounded-lg px-2">
          <CheckCircle size={14} className="text-green-600 shrink-0" />
          <span className="text-xs text-green-700 font-bold">
            Workflow complete — full chain entailment verified at every hop
          </span>
        </div>
      );

    case "workflow_blocked":
      return (
        <div className="flex gap-3 items-center py-2.5 bg-red-50 rounded-lg px-2">
          <XCircle size={14} className="text-red-500 shrink-0" />
          <span className="text-xs text-red-700 font-bold">
            Workflow blocked at {String(data.blocked_at)} — delegation chain terminated
          </span>
        </div>
      );

    case "error":
      return (
        <div className="flex gap-3 items-center py-2.5">
          <AlertTriangle size={14} className="text-orange-500 shrink-0" />
          <span className="text-xs text-orange-700">{String(data.message)}</span>
        </div>
      );

    default:
      return null;
  }
}

export default function EventFeed({ events }: Props) {
  if (events.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-slate-400 text-sm">
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
