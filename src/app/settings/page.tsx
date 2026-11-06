"use client";
import { useSettings, setSettings } from "@/lib/settings";
import { useAnon } from "@/lib/hooks";
import { CHAIN } from "@/lib/ethereum/chains";
import { NETWORKS } from "@/lib/anon-rpc/networks";

const PRESETS = [10, 50, 100, 300, 1000, 2500];

export default function Settings() {
  const s = useSettings();
  const a = useAnon();
  const net = NETWORKS.find((n) => n.id === a.networkId);
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-muted">Stored only in this browser.</p>
      </div>

      <section className="rounded-2xl border border-line bg-card p-5">
        <h2 className="font-semibold">Slippage tolerance</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {PRESETS.map((b) => (
            <button key={b} onClick={() => setSettings({ slippageBps: b })} className={`rounded-lg border px-3 py-1.5 text-sm ${s.slippageBps === b ? "border-accent text-accent" : "border-line text-muted hover:text-fg"}`}>{b / 100}%</button>
          ))}
        </div>
        {s.slippageBps >= 500 && <p className="mt-3 text-xs text-accent">High slippage can be sandwiched. Needed only for tokens that charge a transfer fee.</p>}
      </section>

      <section className="rounded-2xl border border-line bg-card p-5">
        <h2 className="font-semibold">Transaction deadline</h2>
        <div className="mt-3 flex items-center gap-2 text-sm">
          <input type="number" min={1} max={180} value={s.deadlineMin} onChange={(e) => { const n = Math.floor(Number(e.target.value)); if (n >= 1 && n <= 180) setSettings({ deadlineMin: n }); }} className="mono w-24 rounded-lg border border-line bg-card2 px-3 py-2 outline-none focus:border-accent" />
          <span className="text-muted">minutes</span>
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-card p-5 text-sm">
        <h2 className="font-semibold">Network</h2>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-xs text-muted">
          <dt>Chain</dt><dd className="mono text-right text-fg">{CHAIN.name} ({CHAIN.id})</dd>
          <dt>Router</dt><dd className="mono break-all text-right text-fg">{CHAIN.router}</dd>
          <dt>Factory</dt><dd className="mono break-all text-right text-fg">{CHAIN.factory}</dd>
          <dt>Anon-RPC network</dt><dd className="mono text-right text-fg">{net?.label ?? a.networkId}</dd>
        </dl>
        <p className="mt-3 text-xs text-muted">Chain and RPC are set with environment variables (see .env.example); change the Anon-RPC network in the Privacy Center.</p>
      </section>
    </div>
  );
}
