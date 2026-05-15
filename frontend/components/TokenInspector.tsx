"use client";

import { Key, XCircle } from "lucide-react";

interface TokenEvent {
  agent_name: string;
  agent_id: string;
  scopes: string[];
  act_chain_depth: number;
  ii_verified: boolean;
  trace_hash: string;
  jwt_claims: Record<string, unknown>;
}

interface Props {
  tokens: TokenEvent[];
}

function ClaimRow({ label, value, highlight }: { label: string; value: unknown; highlight?: boolean }) {
  return (
    <div className="flex gap-3 text-xs py-1.5 border-b border-slate-100 last:border-0">
      <span className="text-slate-400 w-36 shrink-0 font-mono">{label}</span>
      <span className={clsx(
        "font-mono break-all",
        highlight ? "text-violet-700 font-semibold" : "text-slate-700"
      )}>
        {JSON.stringify(value)}
      </span>
    </div>
  );
}

function clsx(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export default function TokenInspector({ tokens }: Props) {
  if (tokens.length === 0) {
    return (
      <div className="flex items-center justify-center h-16 text-slate-400 text-xs">
        No tokens yet — run a workflow
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tokens.map((t, i) => {
        const withheld = t.jwt_claims.withheld === true;
        return (
          <div
            key={i}
            className={`rounded-xl border p-4 ${
              withheld
                ? "bg-red-50 border-red-200"
                : "bg-white border-green-200 shadow-sm"
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              {withheld
                ? <XCircle size={14} className="text-red-500" />
                : <Key size={14} className="text-green-600" />
              }
              <span className={`text-sm font-semibold ${withheld ? "text-red-700" : "text-green-700"}`}>
                {withheld ? "WITHHELD" : "ISSUED"} — {t.agent_name}
              </span>
              <span className="text-xs text-slate-400 font-mono ml-auto">
                act_depth={t.act_chain_depth}
              </span>
            </div>

            {withheld ? (
              <div>
                <ClaimRow label="blocked_by" value={t.jwt_claims.blocked_by} />
                <ClaimRow label="reason" value={t.jwt_claims.reason} />
                <ClaimRow label="similarity_score" value={t.jwt_claims.similarity_score} />
                <ClaimRow label="mandate" value={t.jwt_claims.mandate} />
                <ClaimRow label="ii_verified" value={false} highlight />
                <ClaimRow label="ii_chain_valid" value={false} highlight />
              </div>
            ) : (
              <div>
                <ClaimRow label="sub" value={t.jwt_claims.sub} />
                <ClaimRow label="scope" value={t.jwt_claims.scope} />
                {!!t.jwt_claims.act && (
                  <ClaimRow label="act (RFC 8693)" value={t.jwt_claims.act} />
                )}
                <ClaimRow label="mandate" value={t.jwt_claims.mandate} highlight />
                <ClaimRow label="mandate_depth" value={t.jwt_claims.mandate_depth} />
                <ClaimRow label="ii_verified" value={t.jwt_claims.ii_verified} highlight />
                <ClaimRow label="ii_chain_valid" value={t.jwt_claims.ii_chain_valid} highlight />
                <ClaimRow label="ii_chain_checks" value={t.jwt_claims.ii_chain_checks} highlight />
                <ClaimRow label="ii_trace_hash" value={t.jwt_claims.ii_trace_hash} />
                <ClaimRow label="ii_cvic_score" value={t.jwt_claims.ii_cvic_score} />
                <p className="text-xs text-slate-400 mt-2 font-mono">
                  trace: {t.trace_hash}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
