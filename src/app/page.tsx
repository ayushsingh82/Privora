import SwapCard from "@/components/swap/SwapCard";
import PrivacyStrip from "@/components/PrivacyStrip";

const STEPS = [
  { n: "01", t: "Read anonymously", d: "Balances, allowances, reserves and quotes are fetched through an Anon-RPC worker, not straight from your IP." },
  { n: "02", t: "Sign with your wallet", d: "Approvals and swaps are signed and sent by your own wallet. Nothing about signing changes." },
  { n: "03", t: "Verify it yourself", d: "The Privacy Center logs every request: which transport carried it, whether it worked, how long it took." },
];

function Head({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">{eyebrow}</div>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-4xl">{title}</h2>
      {sub && <p className="mt-3 text-sm leading-relaxed text-muted md:text-base">{sub}</p>}
    </div>
  );
}

function Node({ t, d, hot }: { t: string; d: string; hot?: boolean }) {
  return (
    <div className={`min-w-[8.5rem] flex-1 rounded-2xl border p-4 text-center ${hot ? "border-accent/50 bg-accent/10" : "border-line bg-card"}`}>
      <div className={`text-sm font-semibold ${hot ? "text-accent" : ""}`}>{t}</div>
      <div className="mt-1 text-xs text-muted">{d}</div>
    </div>
  );
}
const Wire = ({ hot }: { hot?: boolean }) => <div className={`mx-1 hidden h-0.5 w-6 shrink-0 rounded md:block ${hot ? "bg-accent" : "bg-line"}`} />;

type Tone = "good" | "bad" | "neutral";
const COMPARE: [string, string, Tone, string, Tone][] = [
  ["Your IP next to wallet queries", "Visible to the RPC provider", "bad", "Hidden behind the Anon-RPC network", "good"],
  ["Balance, allowance, quote reads", "Direct request from your browser", "bad", "Routed through an Anon-RPC worker", "good"],
  ["If the privacy layer is down", "Not applicable", "neutral", "Reads stop. No silent direct fallback", "good"],
  ["Transactions and address", "Public onchain", "neutral", "Public onchain (not hidden)", "neutral"],
];

function Mark({ tone }: { tone: Tone }) {
  const c = tone === "good" ? "bg-ok/15 text-ok" : tone === "bad" ? "bg-bad/15 text-bad" : "bg-card2 text-muted";
  const d = tone === "good" ? "M3.5 8.5l3 3 6-6.5" : tone === "bad" ? "M4.5 4.5l7 7M11.5 4.5l-7 7" : "M4 8h8";
  return (
    <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${c}`}>
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
    </span>
  );
}

const ICONS: Record<string, string> = {
  lock: "M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z",
  layers: "M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5",
  key: "M14 10a4 4 0 1 0-3.9 4H12l2 2h2v2h2v-2l-3.5-3.5M8 10h.01",
  list: "M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01",
};

const FEATURES = [
  { i: "lock", t: "Fail-closed by design", d: "In Anon-RPC mode, reads never fall back to a direct connection. You get Retry, or an explicit opt-in to Standard." },
  { i: "layers", t: "Real Uniswap V2", d: "Unmodified factory, pair and router contracts. Exact-amount approvals, simulate-before-send, fee-on-transfer support." },
  { i: "key", t: "Per-session isolation", d: "Each wallet session gets a fresh random isolation key, so separate sessions are not linked by the transport." },
  { i: "list", t: "Everything is logged", d: "Method, transport, result and latency for every request. No parameters, addresses or keys are ever stored." },
];

const FAQ = [
  ["Does Privora hide my transactions?", "No. Transactions are signed and broadcast by your wallet and are public onchain. Privora anonymises the reads your browser makes."],
  ["Why is it slower than a normal dapp?", "Anon-RPC sends each read through a mixnet, which adds seconds per request. Privora batches reads with Multicall3 to keep this bearable."],
  ["What if the privacy network is unavailable?", "Privora stops reading and shows an error. You can retry, or deliberately switch to Standard RPC, which is clearly labelled as direct."],
  ["Which networks are supported?", "Sepolia by default and Ethereum mainnet via configuration."],
];

export default function Home() {
  return (
    <div id="top" className="flex flex-col items-center gap-24">
      <section className="flex flex-col items-center gap-8">
        <div className="text-center">
          <span className="rounded-full border border-line bg-card px-3 py-1 text-xs text-muted">Uniswap V2 · powered by Anon-RPC</span>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight md:text-6xl">Swap privately.<br /><span className="text-accent">Read anonymously.</span></h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted md:text-base">
            Privora is the real Uniswap V2, with every chain read routed through Anon-RPC so your RPC provider stops seeing your IP address next to your wallet&apos;s queries.
          </p>
        </div>
        <SwapCard />
        <PrivacyStrip />
      </section>

      <section className="w-full">
        <Head eyebrow="How it works" title="Three steps, one clear boundary" sub="Reads go through the mixnet. Signing stays with your wallet. You can check both." />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="rounded-2xl border border-line bg-card p-6 transition hover:border-white/20">
              <div className="mono text-3xl font-semibold text-accent/70">{s.n}</div>
              <h3 className="mt-3 text-lg font-semibold">{s.t}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="w-full">
        <Head eyebrow="The path" title="Where each request goes" />
        <div className="mt-8 space-y-4 rounded-3xl border border-line bg-card p-5 md:p-6">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent"><span className="h-2 w-2 rounded-full bg-accent" />Reads (anonymised)</div>
            <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center md:gap-0">
              <Node t="Your browser" d="Balances, quotes, reserves" />
              <Wire hot />
              <Node t="Anon-RPC worker" d="Hash-pinned, sandboxed" hot />
              <Wire hot />
              <Node t="Mixnet exit" d="The RPC sees this, not your IP" hot />
              <Wire />
              <Node t="Ethereum RPC" d="Uniswap V2 data" />
            </div>
          </div>
          <div className="border-t border-line pt-4">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted"><span className="h-2 w-2 rounded-full bg-muted" />Writes (not anonymised)</div>
            <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center md:gap-0">
              <Node t="Your wallet" d="Approve, swap, add, remove" />
              <Wire />
              <Node t="Ethereum" d="Public onchain, as always" />
            </div>
          </div>
        </div>
      </section>

      <section className="w-full">
        <Head eyebrow="Compare" title="A normal dapp vs. Privora" />
        <div className="mt-8 overflow-x-auto rounded-2xl border border-line bg-card">
          <div className="grid min-w-[36rem] grid-cols-[1.1fr_1fr_1fr] text-sm">
            <div className="p-4" />
            <div className="p-4 text-xs font-medium uppercase tracking-wider text-muted">Typical dapp</div>
            <div className="bg-accent/10 p-4 text-xs font-semibold uppercase tracking-wider text-accent">Privora</div>
            {COMPARE.map(([k, a, at, b, bt]) => (
              <div key={k} className="contents">
                <div className="border-t border-line p-4 font-medium">{k}</div>
                <div className="flex items-center gap-3 border-t border-line p-4 text-muted"><Mark tone={at} />{a}</div>
                <div className="flex items-center gap-3 border-t border-line bg-accent/10 p-4"><Mark tone={bt} />{b}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full">
        <Head eyebrow="Built in" title="Privacy that fails safe" />
        <div className="mt-8 grid gap-4 md:grid-cols-2">
        {FEATURES.map((f) => (
          <div key={f.t} className="flex gap-4 rounded-2xl border border-line bg-card p-6 transition hover:border-white/20">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={ICONS[f.i]} /></svg>
            </span>
            <div>
              <h3 className="font-semibold">{f.t}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">{f.d}</p>
            </div>
          </div>
        ))}
        </div>
      </section>

      <section className="w-full max-w-3xl">
        <Head eyebrow="FAQ" title="Questions" />
        <div className="mt-8 space-y-3">
          {FAQ.map(([q, a]) => (
            <details key={q} open={q === FAQ[0][0]} className="group rounded-2xl border border-line bg-card px-5 py-4 open:bg-card2/40">
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
                {q}<span className="text-accent transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted">{a}</p>
            </details>
          ))}
        </div>
      </section>

    </div>
  );
}
