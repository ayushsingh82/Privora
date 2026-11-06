"use client";
import { useAnon } from "@/lib/hooks";
import { CHAIN } from "@/lib/ethereum/chains";
import { getNetwork, NETWORKS } from "@/lib/anon-rpc/networks";
import { ModeToggle } from "@/components/Header";
import { killWorker, startWorker } from "@/lib/anon-rpc/manager";

const LABEL = { anon: "Anon-RPC", direct: "Direct RPC", bootstrap: "Direct (bootstrap)" } as const;
const ago = (t: number | null) => (t ? `${Math.max(0, Math.round((Date.now() - t) / 1000))}s ago` : "—");

function Stat({ k, v, tone }: { k: string; v: React.ReactNode; tone?: "ok" | "bad" }) {
  return (
    <div className="rounded-xl border border-line bg-card p-4">
      <div className="text-xs text-muted">{k}</div>
      <div className={`mt-1 text-lg font-semibold ${tone === "ok" ? "text-ok" : tone === "bad" ? "text-bad" : ""}`}>{v}</div>
    </div>
  );
}

export default function PrivacyCenter() {
  const a = useAnon();
  const net = getNetwork(a.networkId);
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Privacy Center</h1>
        <p className="mt-1 text-sm text-muted">Live state of the Anon-RPC integration. Every number here is counted from real requests in this browser session.</p>
      </div>

      <section className="rounded-2xl border border-line bg-card p-5">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          <div className="flex items-center gap-3">
            <span className={`h-3 w-3 rounded-full ${a.status === "ready" ? "bg-ok" : a.status === "failed" ? "bg-bad" : "bg-accent"}`} />
            <div>
              <div className="text-xs uppercase tracking-wider text-muted">Worker</div>
              <div data-worker={a.status} className="text-lg font-semibold capitalize">{a.status}</div>
            </div>
          </div>
          {[
            ["Transport", a.mode === "anon" ? "Anon-RPC" : "Direct RPC"],
            ["Network", net.label.split(" — ")[0]],
            ["Read chain", `${CHAIN.name} (${CHAIN.id})`],
            ["Integrity", a.status === "ready" ? "Hash-pinned, verified" : a.status === "failed" ? "Failed" : "Pending"],
            ["Boot time", a.readyAt && a.startedAt ? `${((a.readyAt - a.startedAt) / 1000).toFixed(1)}s` : "-"],
          ].map(([k, v]) => (
            <div key={k}>
              <div className="text-xs uppercase tracking-wider text-muted">{k}</div>
              <div className="mt-0.5 font-medium">{v}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { id: "anon-ok", k: "Anonymised reads", v: a.anonOk, c: "text-ok", n: "succeeded through Anon-RPC" },
          { id: "anon-failed", k: "Anonymised failures", v: a.anonFailed, c: a.anonFailed ? "text-bad" : "", n: "failed visibly, never retried directly" },
          { id: "direct", k: "Direct reads", v: a.directOk + a.directFailed, c: "", n: "Standard mode only" },
          { id: "bootstrap", k: "Bootstrap reads", v: a.bootstrapOk, c: "", n: "one-time worker setup (direct)" },
        ].map((c) => (
          <div key={c.k} className="rounded-2xl border border-line bg-card p-5">
            <div className="text-xs uppercase tracking-wider text-muted">{c.k}</div>
            <div data-stat={c.id} className={`mono mt-2 text-4xl font-semibold ${c.c}`}>{c.v}</div>
            <div className="mt-1 text-xs text-muted">{c.n}</div>
          </div>
        ))}
      </div>
      <p className="-mt-4 text-xs text-muted">
        Last anonymised read: {ago(a.lastAnonAt)} · Isolation keys used this session: {a.isolationKeys}
      </p>
      {a.error && <div className="rounded-xl border border-bad/40 bg-bad/10 p-3 text-sm text-bad">{a.error}</div>}

      <section className="rounded-2xl border border-line bg-card p-5">
        <h2 className="font-semibold">Controls</h2>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <ModeToggle />
          <select
            value={a.networkId}
            onChange={(e) => startWorker(e.target.value).catch(() => {})}
            className="rounded-lg border border-line bg-card2 px-3 py-2"
          >
            {NETWORKS.map((n) => <option key={n.id} value={n.id}>{n.label}</option>)}
          </select>
          <button onClick={() => startWorker().catch(() => {})} className="rounded-lg border border-line px-3 py-2 hover:border-white/30">Restart worker</button>
          <button onClick={killWorker} className="rounded-lg border border-bad/50 px-3 py-2 text-bad hover:bg-bad/10" title="Demonstrates fail-closed: reads then fail visibly, never fall back to direct">
            Kill worker (fail-closed demo)
          </button>
        </div>
        <p className="mt-3 text-xs text-muted">{net.note} The passthrough reference worker is hash-pinned but does not anonymize, so it is rejected in Anon-RPC mode.</p>
      </section>

      <section>
        <h2 className="mb-3 font-semibold">Request activity <span className="text-xs font-normal text-muted">(latest {a.log.length}; method names only, no parameters)</span></h2>
        <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="w-full text-left text-sm">
            <thead className="bg-card text-xs text-muted">
              <tr><th className="px-4 py-2">Time</th><th className="px-4 py-2">Request</th><th className="px-4 py-2">Transport</th><th className="px-4 py-2">Status</th><th className="px-4 py-2 text-right">ms</th></tr>
            </thead>
            <tbody>
              {a.log.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-muted">No requests yet.</td></tr>}
              {a.log.map((e) => (
                <tr key={e.id} className="border-t border-line">
                  <td className="mono whitespace-nowrap px-4 py-2 text-xs text-muted">{new Date(e.ts).toLocaleTimeString()}</td>
                  <td className="mono px-4 py-2 text-xs">{e.method}</td>
                  <td className="px-4 py-2"><span className={`rounded-full px-2 py-0.5 text-xs ${e.transport === "anon" ? "bg-accent/15 text-accent" : "bg-card2 text-muted"}`}>{LABEL[e.transport]}</span></td>
                  <td className={`px-4 py-2 text-xs ${e.ok ? "text-ok" : "text-bad"}`}>{e.ok ? "Success" : `Failed — ${e.error}`}</td>
                  <td className="mono px-4 py-2 text-right text-xs text-muted">{e.ms ? Math.round(e.ms) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-line bg-card p-5">
          <h3 className="font-semibold">Standard mode</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
            <li>Reads go straight from your browser to the RPC endpoint.</li>
            <li>The endpoint sees your IP address next to every query.</li>
            <li>Wallet-related query patterns (balances, allowances, positions) can be linked to that IP.</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-accent/30 bg-card p-5">
          <h3 className="font-semibold text-accent">Anon-RPC mode</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
            <li>Reads are sent through the Anon-RPC worker: a hash-pinned, sandboxed anonymising transport.</li>
            <li>Intended to reduce IP-to-query linkability. It is subject to the threat model of the selected network ({net.id}).</li>
            <li>Each wallet session uses its own random isolation key so reads from different sessions are not intentionally grouped together. Isolation is not a guarantee of anonymity.</li>
          </ul>
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-card p-5 text-sm">
        <h3 className="font-semibold">What is — and is not — anonymised</h3>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <div>
            <div className="text-xs uppercase tracking-wide text-ok">Via Anon-RPC</div>
            <p className="mt-1 text-muted">ETH &amp; ERC-20 balances, allowances, factory/pair lookups, reserves, router quotes, LP balances, token metadata, transaction-receipt polling.</p>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-bad">Not anonymised</div>
            <p className="mt-1 text-muted">Transaction signing and broadcast (your wallet&apos;s own RPC), the wallet itself, public onchain activity and your address, the one-time specifier bootstrap read, and the page/JS load.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
