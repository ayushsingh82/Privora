import Reveal from "@/components/Reveal";
import Link from "next/link";
import { ExposedArt, FeatureArt, HeroArt, StepReadArt, StepVerifyArt, StepWalletArt, VeiledArt } from "@/components/art";

const STEPS = [
  { n: "01", t: "Lookups go through Anon-RPC", d: "Your balances, token allowances, pool reserves and price quotes are fetched through an anonymising network, not straight from your browser to an RPC company." },
  { n: "02", t: "Your wallet signs, as always", d: "Approving and swapping happen inside your own wallet (MetaMask, Rabby and others). Privora never holds your keys or your funds." },
  { n: "03", t: "Check it yourself", d: "The Privacy Center lists every request, the route it took and how long it took. If the privacy layer goes down, Privora stops instead of quietly falling back." },
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
    <div className={`min-w-[8.5rem] flex-1 rounded-none border p-4 text-center ${hot ? "border-accent/50 bg-accent/10" : "border-line bg-card"}`}>
      <div className={`text-sm font-semibold ${hot ? "text-accent" : ""}`}>{t}</div>
      <div className="mt-1 text-xs text-muted">{d}</div>
    </div>
  );
}
const Wire = ({ hot, d = 0 }: { hot?: boolean; d?: number }) => (
  <div className="relative mx-1 hidden h-0.5 w-8 shrink-0 overflow-hidden rounded bg-line md:block">
    {hot && <span style={{ ["--d" as string]: `${d}ms` }} className="wire-pulse absolute inset-y-0 w-3.5 rounded bg-accent" />}
  </div>
);

const EXPOSURE = [
  { t: "Your network identity", p: "IP address, rough location and browser, attached to every request.", d: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c2.5 3 2.5 15 0 18M12 3c-2.5 3-2.5 15 0 18" },
  { t: "Your wallets", p: "Every address you check is revealed, and linked to the identity above.", d: "M3 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7zM3 7l2-3h12M16 14h3" },
  { t: "Your interests", p: "Which tokens and pools you look at, even if you never trade them.", d: "M12 3 3 8l9 5 9-5-9-5zM3 13l9 5 9-5" },
  { t: "Your habits", p: "When and how often you check in, building a pattern over time.", d: "M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 8v4l3 2" },
];

const SIDES = [
  { name: "A typical dapp", hot: false, path: ["You", "RPC provider"], items: ["Who is asking: your IP address and location, on every request", "Which wallets and pools you look up, tied to you", "Your habits over time, easy to profile"] },
  { name: "Privora", hot: true, path: ["You", "Anon-RPC", "RPC provider"], items: ["Requests arrive from a mixnet exit, so they can't be tied to you", "Lookups stay unlinked, with a fresh key for every session", "No direct fallback: if privacy fails, reads stop"] },
];

const FEATURES = [
  { i: "lock", t: "Fails closed, never quietly", d: "In Anon-RPC mode a read is never sent directly. If the privacy layer is down you see an error with Retry, or you can choose Standard RPC yourself." },
  { i: "layers", t: "The real Uniswap V2", d: "Prices and swaps come from the unmodified Uniswap V2 router and pair contracts onchain. No price API, no aggregator, no custom AMM." },
  { i: "key", t: "A fresh identity per session", d: "Each wallet session gets its own random isolation key, so reads from different sessions are not tied together by the transport." },
  { i: "list", t: "Nothing hidden, nothing stored", d: "Every request is logged by method, route, result and time, and never by parameters, addresses or keys. Export the log any time." },
];

const FAQ = [
  ["Does Privora hide my transactions?", "No. Transactions are signed and broadcast by your wallet and are public onchain, like on any dapp. Privora anonymises the lookups your browser makes before you trade: balances, allowances, pools and quotes."],
  ["Where do prices and quotes come from?", "From the Uniswap V2 router contract itself. Privora calls getAmountsOut onchain for the pool of your pair (or via WETH), through Anon-RPC. There is no price API or aggregator in between."],
  ["Which pools does it use?", "Uniswap V2 pools from the official factory on the connected network, Sepolia by default. Pools are discovered from the factory and shown on the Pools page with live reserves."],
  ["Why is it slower than a normal dapp?", "Anon-RPC sends each lookup through a mixnet, which adds a few seconds per request. Privora batches many reads into one call with Multicall3 to keep this reasonable."],
  ["What if the privacy network is unavailable?", "Privora stops reading and shows an error. You can retry, or deliberately switch to Standard RPC, which is clearly labelled as direct."],
  ["Which networks are supported?", "Sepolia by default, and Ethereum mainnet through configuration."],
];

export default function Home() {
  return (
    <div id="top" className="flex flex-col items-center gap-10">
      <section className="relative flex min-h-[88vh] w-full flex-col justify-center gap-14 py-10">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <span className="fade-up inline-flex items-center gap-2 border border-line bg-card px-3.5 py-1.5 text-xs text-muted"><span className="h-1.5 w-1.5 rounded-full bg-accent" />Built on Uniswap V2 · Powered by Anon-RPC</span>
            <h1 style={{ ["--d" as string]: "100ms" }} className="fade-up mt-6 text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl">Swap privately.<br /><span className="text-accent">Read anonymously.</span></h1>
            <p style={{ ["--d" as string]: "200ms" }} className="fade-up mt-6 max-w-xl text-base leading-relaxed text-muted md:text-lg">
              The Uniswap you already know, with a private way to look things up. Your balances, prices and pool data travel through Anon-RPC, so no RPC provider can tell who is asking or build a profile of your wallet.
            </p>
            <div style={{ ["--d" as string]: "300ms" }} className="fade-up mt-9 flex flex-wrap gap-3">
              <Link href="/swap" className="rounded-md bg-accent px-8 py-3.5 text-base font-semibold text-accent-fg shadow-lg shadow-accent/30 transition hover:brightness-110 active:scale-[.98]">Launch App</Link>
              <a href="#how" className="rounded-md bg-card px-8 py-3.5 text-base font-semibold transition hover:bg-card2">See how it works</a>
            </div>
            <p style={{ ["--d" as string]: "380ms" }} className="fade-up mt-5 text-sm text-muted">Real Uniswap V2 contracts · Non-custodial · Reads never fall back to a normal RPC</p>
          </div>
          <div style={{ ["--d" as string]: "250ms" }} className="fade-up"><HeroArt className="h-auto w-full" /></div>
        </div>
        <dl style={{ ["--d" as string]: "450ms" }} className="fade-up grid w-full grid-cols-2 gap-px border border-line bg-line text-left md:grid-cols-4">
          {[
            ["Swap engine", "Uniswap V2", "M12 3 3 8l9 5 9-5-9-5zM3 13l9 5 9-5"],
            ["Read privacy", "Anon-RPC", "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"],
            ["Signing", "Your wallet", "M3 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7zM3 7l2-3h12M16 14h3"],
            ["Custody", "Non-custodial", "M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z"],
          ].map(([k, v, d]) => (
            <div key={k} className="flex items-center gap-4 bg-card px-6 py-5">
              <span className="grid h-10 w-10 shrink-0 place-items-center bg-accent/15 text-accent">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg>
              </span>
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wider text-muted">{k}</dt>
                <dd className="mt-0.5 text-base font-semibold">{v}</dd>
              </div>
            </div>
          ))}
        </dl>
      </section>

      <Reveal className="w-full flex justify-center">
      <section className="w-full min-h-[70vh] flex flex-col justify-center">
        <Head eyebrow="The problem" title="Every lookup tells an RPC provider who is asking" sub="Before you trade, your wallet app reads the chain: balances, prices, pools. Those reads go to a company that sees much more than the number it returns." />
        <div className="mt-10 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {EXPOSURE.map((x) => (
            <div key={x.t} className="bg-card p-7">
              <span className="grid h-11 w-11 place-items-center bg-accent/15 text-accent">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={x.d} /></svg>
              </span>
              <h3 className="mt-5 text-lg font-semibold">{x.t}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{x.p}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 max-w-3xl text-base leading-relaxed text-muted md:text-lg">Put together, that is a profile: <span className="text-fg">this person, from this place, owns this wallet, watches these tokens, and checks in at these times.</span> Privora is built to break that link.</p>
      </section>
      </Reveal>

      <Reveal className="w-full flex justify-center">
      <section id="how" className="w-full scroll-mt-24 min-h-[85vh] flex flex-col justify-center">
        <Head eyebrow="How it works" title="Private lookups, normal signing" sub="Privora changes how your browser reads the chain. It does not change how you trade." />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.n} className="lift border border-line bg-card p-8">
              <div className="mb-6">{[<StepReadArt key="a" />, <StepWalletArt key="b" />, <StepVerifyArt key="c" />][i]}</div>
              <div className="mono text-sm font-semibold tracking-widest text-accent">{s.n}</div>
              <h3 className="mt-2 text-xl font-semibold">{s.t}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">{s.d}</p>
            </div>
          ))}
        </div>
      </section>
      </Reveal>

      <Reveal className="w-full flex justify-center">
      <section className="w-full min-h-[85vh] flex flex-col justify-center">
        <Head eyebrow="The path" title="Where each request goes" sub="Reads take the private route. Writes use your wallet, exactly as before." />
        <div className="mt-8 space-y-4 rounded-none border border-line bg-card p-5 md:p-6">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent"><span className="h-2 w-2 rounded-md bg-accent" />Reads (anonymised)</div>
            <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center md:gap-0">
              <Node t="Your browser" d="Balances, quotes, reserves" />
              <Wire hot d={0} />
              <Node t="Anon-RPC worker" d="Hash-pinned, sandboxed" hot />
              <Wire hot d={400} />
              <Node t="Mixnet exit" d="The RPC sees this, not your IP" hot />
              <Wire />
              <Node t="Ethereum RPC" d="Uniswap V2 data" />
            </div>
          </div>
          <div className="border-t border-line pt-4">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted"><span className="h-2 w-2 rounded-md bg-muted" />Writes (signed by your wallet)</div>
            <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center md:gap-0">
              <Node t="Your wallet" d="Approve, swap, add, remove" />
              <Wire />
              <Node t="Ethereum" d="Signed and sent by your wallet" />
            </div>
          </div>
        </div>
      </section>
      </Reveal>

      <Reveal className="w-full flex justify-center">
      <section id="compare" className="w-full scroll-mt-24 min-h-[85vh] flex flex-col justify-center">
        <Head eyebrow="Compare" title="What the RPC provider can link to you" />
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {SIDES.map((side) => (
            <div key={side.name} className={`border p-8 ${side.hot ? "border-accent/40 bg-accent/5" : "border-line bg-card"}`}>
              <div className={`text-xs font-semibold uppercase tracking-wider ${side.hot ? "text-accent" : "text-muted"}`}>{side.name}</div>
              <div className="mt-5">{side.hot ? <VeiledArt /> : <ExposedArt />}</div>
              <div className="mt-6 text-sm font-medium">The RPC provider sees</div>
              <ul className="mt-3 space-y-3 text-sm">
                {side.items.map((t) => (
                  <li key={t} className="flex items-start gap-3"><span className={`mt-2 h-1.5 w-1.5 shrink-0 ${side.hot ? "bg-accent" : "bg-bad"}`} /><span className={side.hot ? "" : "text-muted"}>{t}</span></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
      </Reveal>

      <Reveal className="w-full flex justify-center">
      <section className="w-full min-h-[85vh] flex flex-col justify-center">
        <Head eyebrow="Built in" title="Built to fail safe" />
        <div className="mt-8 grid gap-4 md:grid-cols-2">
        {FEATURES.map((f) => (
          <div key={f.t} className="flex items-center gap-6 lift border border-line bg-card p-8">
            <FeatureArt kind={f.i as "lock" | "layers" | "key" | "list"} />
            <div>
              <h3 className="text-lg font-semibold">{f.t}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">{f.d}</p>
            </div>
          </div>
        ))}
        </div>
      </section>
      </Reveal>

      <Reveal className="w-full flex justify-center">
      <section id="faq" className="w-full max-w-3xl scroll-mt-24 min-h-[85vh] flex flex-col justify-center">
        <Head eyebrow="FAQ" title="Questions" />
        <div className="mt-8 space-y-3">
          {FAQ.map(([q, a]) => (
            <details key={q} open={q === FAQ[0][0]} className="group rounded-none border border-line bg-card px-5 py-4 open:bg-card2/40">
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
                {q}<span className="text-accent transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted">{a}</p>
            </details>
          ))}
        </div>
      </section>
      </Reveal>
    </div>
  );
}
