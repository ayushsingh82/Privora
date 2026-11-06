import SwapCard from "@/components/swap/SwapCard";
import PrivacyStrip from "@/components/PrivacyStrip";
import Link from "next/link";

const STEPS = [
  { n: "1", t: "Read anonymously", d: "Balances, allowances, reserves and quotes are fetched through an Anon-RPC worker, not straight from your IP." },
  { n: "2", t: "Sign with your wallet", d: "Approvals and swaps are signed and sent by your own wallet. Nothing about signing changes." },
  { n: "3", t: "Verify it yourself", d: "The Privacy Center logs every request: which transport carried it, whether it worked, how long it took." },
];

export default function Home() {
  return (
    <div className="flex flex-col items-center gap-14">
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

      <section className="grid w-full gap-4 md:grid-cols-3">
        {STEPS.map((s) => (
          <div key={s.n} className="rounded-2xl border border-line bg-card p-5">
            <div className="grid h-7 w-7 place-items-center rounded-full bg-accent/15 text-sm font-semibold text-accent">{s.n}</div>
            <h3 className="mt-3 font-semibold">{s.t}</h3>
            <p className="mt-1 text-sm text-muted">{s.d}</p>
          </div>
        ))}
      </section>

      <section className="w-full rounded-2xl border border-line bg-card p-6 text-sm">
        <h2 className="font-semibold">What Privora does not claim</h2>
        <p className="mt-2 text-muted">
          Anon-RPC anonymises chain <em>reads</em>. Your transactions and address are public onchain, and your wallet extension has its own network traffic.
          Anonymity depends on the selected Anon-RPC network&apos;s threat model.{" "}
          <Link href="/privacy" className="text-accent underline">See the live request log →</Link>
        </p>
      </section>
    </div>
  );
}
