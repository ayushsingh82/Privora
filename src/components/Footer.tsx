import Link from "next/link";
import Logo from "./Logo";

const COLS = [
  { h: "Trade", l: [["Swap", "/swap"], ["Liquidity", "/liquidity"], ["Pools", "/pools"]] },
  { h: "Privacy", l: [["Privacy", "/privacy"], ["Settings", "/settings"]] },
  { h: "Docs", l: [
    ["Anon-RPC integration", "https://github.com/ayushsingh82/ethglobalmumbai/blob/main/docs/ANON_RPC_INTEGRATION.md"],
    ["Test report", "https://github.com/ayushsingh82/ethglobalmumbai/blob/main/docs/TEST_REPORT.md"],
    ["GitHub", "https://github.com/ayushsingh82/ethglobalmumbai"],
  ] },
] as const;

export default function Footer() {
  return (
    <footer className="mt-20 bg-card/40">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-[1.6fr_repeat(3,1fr)]">
        <div>
          <div className="flex items-center gap-2 text-lg font-semibold"><Logo size={28} />Privora</div>
          <p className="mt-3 max-w-xs text-sm text-muted">Swap privately. Read anonymously. The real Uniswap V2 contracts, with every chain read routed through Anon-RPC.</p>
        </div>
        {COLS.map((c) => (
          <div key={c.h}>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">{c.h}</h4>
            <ul className="mt-3 space-y-2 text-sm">
              {c.l.map(([t, href]) => (
                <li key={t}>
                  {href.startsWith("http")
                    ? <a href={href} target="_blank" rel="noreferrer" className="hover:text-accent">{t}</a>
                    : <Link href={href} className="hover:text-accent">{t}</Link>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div aria-hidden className="select-none overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 text-center text-[22vw] font-bold leading-[0.85] tracking-tighter text-accent/20 md:text-[11rem]">
          Privora
        </div>
      </div>
    </footer>
  );
}
