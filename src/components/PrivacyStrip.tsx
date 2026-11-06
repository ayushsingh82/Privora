"use client";
import { useAnon } from "@/lib/hooks";
import { CHAIN } from "@/lib/ethereum/chains";

/** Live, honest status chips under the swap card. Every number is counted from real requests this session. */
export default function PrivacyStrip() {
  const a = useAnon();
  const state = a.mode === "direct" ? "Standard RPC" : a.status === "ready" ? "Anon-RPC active" : a.status === "failed" ? "Anon-RPC unavailable" : "Anon-RPC starting…";
  const tone = a.mode === "direct" ? "bg-muted" : a.status === "ready" ? "bg-ok" : a.status === "failed" ? "bg-bad" : "bg-accent";
  const Chip = ({ k, v }: { k: string; v: React.ReactNode }) => (
    <div className="rounded-xl border border-line bg-card px-4 py-3">
      <div className="text-[11px] uppercase tracking-wide text-muted">{k}</div>
      <div className="mono mt-0.5 text-sm">{v}</div>
    </div>
  );
  return (
    <div className="grid w-full max-w-3xl grid-cols-2 gap-3 md:grid-cols-4">
      <Chip k="Read transport" v={<span className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${tone}`} />{state}</span>} />
      <Chip k="Anonymised reads" v={a.anonOk} />
      <Chip k="Direct reads" v={a.directOk + a.directFailed} />
      <Chip k="Network" v={CHAIN.name} />
    </div>
  );
}
