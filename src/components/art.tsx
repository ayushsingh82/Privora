// Custom illustrations for the landing page. Inline SVG, theme colours, no external assets.
const A = "stroke-accent";
const L = "stroke-line";

/** Hero: your browser -> Anon-RPC shield -> mixnet nodes -> RPC provider. */
export function HeroArt({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 620 360" className={className} role="img" aria-label="A browser sends reads through an Anon-RPC shield and a mixnet to the RPC provider">
      {/* mixnet nodes */}
      {[[250, 70], [262, 290], [390, 62], [380, 298], [320, 40], [330, 320]].map(([x, y], i) => (
        <g key={i}>
          <line x1="310" y1="180" x2={x} y2={y} className={L} strokeWidth="1.5" strokeDasharray="3 6" />
          <circle cx={x} cy={y} r="7" className="net-node fill-accent" style={{ animationDelay: `${i * 0.45}s` }} />
        </g>
      ))}
      {/* browser */}
      <g>
        <rect x="28" y="96" width="164" height="168" className="fill-card2 stroke-line" strokeWidth="2" />
        <rect x="28" y="96" width="164" height="26" className="fill-card" />
        {[44, 58, 72].map((x) => <circle key={x} cx={x} cy="109" r="4" className="fill-muted" opacity=".6" />)}
        <rect x="48" y="146" width="124" height="14" className="fill-line" />
        <rect x="48" y="170" width="86" height="10" className="fill-line" opacity=".7" />
        <rect x="48" y="196" width="124" height="44" className="fill-bg stroke-line" strokeWidth="1.5" />
        <circle cx="70" cy="218" r="10" className="fill-accent" opacity=".9" />
        <rect x="90" y="212" width="66" height="12" className="fill-line" />
      </g>
      {/* flow lines */}
      <line x1="192" y1="180" x2="252" y2="180" className={`${A} line-flow`} strokeWidth="3" strokeDasharray="6 10" />
      <line x1="368" y1="180" x2="436" y2="180" className={`${A} line-flow`} strokeWidth="3" strokeDasharray="6 10" style={{ animationDelay: ".6s" }} />
      {/* request packets */}
      {[0, 1.2].map((d) => (
        <circle key={d} r="5" className="fill-accent">
          <animateMotion dur="2.4s" begin={`${d}s`} repeatCount="indefinite" path="M192 180 L436 180" />
          <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.4s" begin={`${d}s`} repeatCount="indefinite" />
        </circle>
      ))}
      {/* shield */}
      <g>
        <path d="M310 108 366 130v50c0 38-24 62-56 76-32-14-56-38-56-76v-50z" className="fill-accent/15 stroke-accent" strokeWidth="3" />
        <circle cx="310" cy="176" r="14" className="fill-accent" />
        <path d="M303 186h14l-3 26h-8z" className="fill-accent" />
      </g>
      {/* RPC provider */}
      <g>
        {[100, 156, 212].map((y, i) => (
          <g key={y}>
            <rect x="436" y={y} width="156" height="46" className="fill-card2 stroke-line" strokeWidth="2" />
            <circle cx="458" cy={y + 23} r="5" className={i === 1 ? "fill-ok" : "fill-muted"} />
            <rect x="476" y={y + 17} width="80" height="12" className="fill-line" />
          </g>
        ))}
      </g>
      <text x="514" y="84" textAnchor="middle" className="fill-muted" fontSize="14">RPC provider</text>
      <text x="514" y="276" textAnchor="middle" className="fill-accent" fontSize="13">sees the query, not who asked</text>
      <text x="110" y="290" textAnchor="middle" className="fill-muted" fontSize="14">Your browser</text>
      <text x="310" y="346" textAnchor="middle" className="fill-accent" fontSize="15" fontWeight="600">Anon-RPC</text>
    </svg>
  );
}

const card = "fill-card2 stroke-line";
const T = { fontFamily: "ui-sans-serif, system-ui, sans-serif" } as const;
const M = { fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" } as const;

/** Step 1: a slice of the request log, every row routed through Anon-RPC. */
export function StepReadArt() {
  return (
    <svg viewBox="0 0 260 160" className="h-auto w-full" role="img" aria-label="Request log where every lookup is routed through Anon-RPC">
      <rect x="2" y="2" width="256" height="156" className={card} strokeWidth="2" />
      <rect x="2" y="2" width="256" height="32" className="fill-card" />
      <text x="16" y="23" fontSize="12" fontWeight="600" className="fill-fg" style={T}>Request activity</text>
      <circle cx="206" cy="18" r="3.5" className="fill-ok" /><text x="214" y="22" fontSize="10" className="fill-muted" style={T}>Live</text>
      {[54, 84, 114].map((y, i) => (
        <g key={y}>
          <text x="16" y={y + 4} fontSize="11" className="fill-fg" style={M}>eth_call</text>
          <rect x="88" y={y - 9} width="68" height="20" className="fill-accent/20" />
          <text x="122" y={y + 5} textAnchor="middle" fontSize="10" fontWeight="600" className="fill-accent" style={T}>Anon-RPC</text>
          <rect x="166" y={y - 2} width={[40, 28, 52][i]} height="5" className="fill-accent/60" />
          <circle cx="236" cy={y + 1} r="8" className="fill-ok/20" />
          <path d={`M232 ${y + 1}l3 3 5-6`} className="stroke-ok" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      ))}
      <line x1="2" y1="136" x2="258" y2="136" className="stroke-line" />
      <text x="16" y="151" fontSize="10" className="fill-muted" style={T}>method and route only, never parameters</text>
    </svg>
  );
}

/** Step 2: the wallet's own confirmation. */
export function StepWalletArt() {
  return (
    <svg viewBox="0 0 260 160" className="h-auto w-full" role="img" aria-label="Wallet confirmation dialog">
      <rect x="2" y="2" width="256" height="156" className={card} strokeWidth="2" />
      <circle cx="26" cy="24" r="11" className="fill-accent/20" />
      <path d="M20 22h12v8H20zM20 22l9-5v5" className="stroke-accent" fill="none" strokeWidth="2" strokeLinejoin="round" />
      <text x="46" y="28" fontSize="13" fontWeight="600" className="fill-fg" style={T}>Confirm swap</text>
      <text x="244" y="28" textAnchor="end" fontSize="10" className="fill-muted" style={T}>Your wallet</text>
      {[["You pay", 60], ["You receive", 84]].map(([l, y]) => (
        <g key={l as string}>
          <text x="16" y={(y as number) + 4} fontSize="11" className="fill-muted" style={T}>{l}</text>
          <rect x="120" y={(y as number) - 5} width="124" height="12" className="fill-line" />
        </g>
      ))}
      <text x="16" y="112" fontSize="11" className="fill-muted" style={T}>Approval</text>
      <text x="244" y="112" textAnchor="end" fontSize="11" fontWeight="600" className="fill-ok" style={T}>Exact amount</text>
      <rect x="16" y="124" width="100" height="26" className="fill-bg stroke-line" strokeWidth="1.5" />
      <text x="66" y="141" textAnchor="middle" fontSize="12" className="fill-muted" style={T}>Reject</text>
      <rect x="128" y="124" width="116" height="26" className="fill-accent" />
      <text x="186" y="141" textAnchor="middle" fontSize="12" fontWeight="700" className="fill-bg" style={T}>Confirm</text>
    </svg>
  );
}

/** Step 3: the proof, private reads up and direct reads at zero. */
export function StepVerifyArt() {
  const bars = [14, 26, 20, 36, 30, 44, 38, 50];
  return (
    <svg viewBox="0 0 260 160" className="h-auto w-full" role="img" aria-label="Counters showing private reads rising and direct reads at zero">
      <rect x="2" y="2" width="256" height="156" className={card} strokeWidth="2" />
      <rect x="14" y="14" width="150" height="132" className="fill-card" />
      <text x="26" y="34" fontSize="10" letterSpacing="1" className="fill-muted" style={T}>PRIVATE READS</text>
      {bars.map((h, i) => <rect key={i} x={28 + i * 16} y={130 - h} width="10" height={h} className="fill-accent" opacity={0.35 + i * 0.09} />)}
      <text x="26" y="66" fontSize="22" fontWeight="700" className="fill-ok" style={M}>128</text>
      <rect x="174" y="14" width="72" height="132" className="fill-card" />
      <text x="184" y="34" fontSize="10" letterSpacing="1" className="fill-muted" style={T}>DIRECT</text>
      <text x="184" y="80" fontSize="34" fontWeight="700" className="fill-fg" style={M}>0</text>
      <circle cx="196" cy="116" r="10" className="fill-ok/20" />
      <path d="M191 116l4 4 7-8" className="stroke-ok" fill="none" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <text x="212" y="120" fontSize="10" className="fill-ok" style={T}>none</text>
    </svg>
  );
}

/** Compare: what the RPC provider can link. */
export function ExposedArt() {
  return (
    <svg viewBox="0 0 320 84" className="h-auto w-full max-w-[320px]" role="img" aria-label="Your identity reaches the RPC provider with every query">
      <rect x="2" y="22" width="78" height="40" className={card} strokeWidth="2" />
      <text x="41" y="47" textAnchor="middle" fontSize="12" className="fill-fg" style={T}>You</text>
      <line x1="80" y1="42" x2="238" y2="42" className="stroke-bad line-flow" strokeWidth="2.5" strokeDasharray="6 8" />
      <rect x="112" y="28" width="82" height="28" className="fill-bad/20 stroke-bad" strokeWidth="1.5" />
      <text x="153" y="46" textAnchor="middle" fontSize="11" fontWeight="600" className="fill-bad" style={T}>who you are</text>
      <rect x="238" y="22" width="80" height="40" className={card} strokeWidth="2" />
      <text x="278" y="47" textAnchor="middle" fontSize="12" className="fill-fg" style={T}>RPC</text>
    </svg>
  );
}
export function VeiledArt() {
  return (
    <svg viewBox="0 0 320 84" className="h-auto w-full max-w-[320px]" role="img" aria-label="The RPC provider receives the query from an anonymous mixnet exit">
      <rect x="2" y="22" width="62" height="40" className={card} strokeWidth="2" />
      <text x="33" y="47" textAnchor="middle" fontSize="12" className="fill-fg" style={T}>You</text>
      <line x1="64" y1="42" x2="124" y2="42" className="stroke-accent line-flow" strokeWidth="2.5" strokeDasharray="6 8" />
      <path d="M160 8 192 20v22c0 18-13 29-32 36-19-7-32-18-32-36V20z" className="fill-accent/20 stroke-accent" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M148 42l9 9 16-18" className="stroke-accent" fill="none" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="196" y1="42" x2="252" y2="42" className="stroke-accent line-flow" strokeWidth="2.5" strokeDasharray="6 8" />
      <rect x="196" y="62" width="82" height="18" className="fill-accent/20" />
      <text x="237" y="75" textAnchor="middle" fontSize="10" fontWeight="600" className="fill-accent" style={T}>anonymous exit</text>
      <rect x="252" y="22" width="66" height="40" className={card} strokeWidth="2" />
      <text x="285" y="47" textAnchor="middle" fontSize="12" className="fill-fg" style={T}>RPC</text>
    </svg>
  );
}

/** Feature illustrations: small product UI, not icons. */
export function FeatureArt({ kind }: { kind: "lock" | "layers" | "key" | "list" }) {
  const wrap = "h-auto w-full max-w-[210px] shrink-0";
  if (kind === "lock") return (
    <svg viewBox="0 0 210 120" className={wrap} aria-hidden>
      <rect x="2" y="2" width="206" height="116" className={card} strokeWidth="2" />
      {[["Direct fallback", 34, false], ["Anon-RPC only", 78, true]].map(([l, y, on]) => (
        <g key={l as string}>
          <text x="14" y={(y as number) + 5} fontSize="12" className={on ? "fill-fg" : "fill-muted"} style={T}>{l}</text>
          <rect x="150" y={(y as number) - 9} width="44" height="24" className={on ? "fill-accent" : "fill-line"} />
          <rect x={on ? 174 : 154} y={(y as number) - 5} width="16" height="16" className={on ? "fill-bg" : "fill-muted"} />
        </g>
      ))}
      <line x1="14" y1="56" x2="196" y2="56" className="stroke-line" />
      <text x="14" y="108" fontSize="10" className="fill-ok" style={T}>Locked: reads stop, never leak</text>
    </svg>
  );
  if (kind === "layers") return (
    <svg viewBox="0 0 210 120" className={wrap} aria-hidden>
      {[["Router02", 6, "fill-accent/25 stroke-accent"], ["Pair", 44, "fill-card2 stroke-line"], ["Factory", 82, "fill-card2 stroke-line"]].map(([l, y, c], i) => (
        <g key={l as string}>
          <rect x={10 + i * 12} y={y as number} width="170" height="30" className={c as string} strokeWidth="2" />
          <text x={22 + i * 12} y={(y as number) + 20} fontSize="12" fontWeight="600" className={i === 0 ? "fill-accent" : "fill-fg"} style={T}>{l}</text>
          <text x={168 + i * 12} y={(y as number) + 20} textAnchor="end" fontSize="9" className="fill-muted" style={M}>unmodified</text>
        </g>
      ))}
    </svg>
  );
  if (kind === "key") return (
    <svg viewBox="0 0 210 120" className={wrap} aria-hidden>
      <rect x="2" y="2" width="206" height="116" className={card} strokeWidth="2" />
      {["Session 1", "Session 2", "Session 3"].map((l, i) => (
        <g key={l}>
          <text x="14" y={32 + i * 32} fontSize="11" className="fill-muted" style={T}>{l}</text>
          <rect x="80" y={18 + i * 32} width="116" height="22" className="fill-bg stroke-line" strokeWidth="1.5" />
          <circle cx="94" cy={29 + i * 32} r="5" className={["fill-accent", "fill-ok", "fill-muted"][i]} />
          <text x="108" y={33 + i * 32} fontSize="11" className="fill-fg" style={M}>{["•••• a1", "•••• 9c", "•••• 4e"][i]}</text>
        </g>
      ))}
    </svg>
  );
  return (
    <svg viewBox="0 0 210 120" className={wrap} aria-hidden>
      <rect x="2" y="2" width="206" height="116" className={card} strokeWidth="2" />
      {[["method", "route", "ms"], ["eth_call", "Anon", "1.2s"], ["eth_call", "Anon", "0.9s"]].map((r, i) => (
        <g key={i}>
          <text x="14" y={26 + i * 22} fontSize="10" className={i === 0 ? "fill-muted" : "fill-fg"} style={i === 0 ? T : M}>{r[0]}</text>
          <text x="96" y={26 + i * 22} fontSize="10" className={i === 0 ? "fill-muted" : "fill-accent"} style={T}>{r[1]}</text>
          <text x="196" y={26 + i * 22} textAnchor="end" fontSize="10" className="fill-muted" style={M}>{r[2]}</text>
        </g>
      ))}
      <rect x="14" y="78" width="182" height="26" className="fill-bad/10 stroke-bad" strokeWidth="1.5" strokeDasharray="4 3" />
      <text x="105" y="95" textAnchor="middle" fontSize="11" className="fill-bad" style={T}>params, addresses: never stored</text>
    </svg>
  );
}
