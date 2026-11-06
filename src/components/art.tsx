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
      <text x="514" y="86" textAnchor="middle" className="fill-muted" fontSize="13">sees the exit, not you</text>
      <text x="110" y="290" textAnchor="middle" className="fill-muted" fontSize="13">your browser</text>
      <text x="310" y="342" textAnchor="middle" className="fill-accent" fontSize="13" fontWeight="600">Anon-RPC</text>
    </svg>
  );
}

const frame = "h-24 w-24";
/** Step 1: lookups travel privately. */
export function StepReadArt() {
  return (
    <svg viewBox="0 0 96 96" className={frame} aria-hidden>
      <path d="M8 48c10-18 24-28 40-28s30 10 40 28c-10 18-24 28-40 28S18 66 8 48z" className="fill-accent/10 stroke-accent" strokeWidth="3" strokeLinejoin="round" />
      <circle cx="48" cy="48" r="11" className="fill-accent" />
      <path d="M18 80 78 16" className="stroke-bg" strokeWidth="9" strokeLinecap="round" />
      <path d="M18 80 78 16" className="stroke-accent" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
/** Step 2: your wallet signs. */
export function StepWalletArt() {
  return (
    <svg viewBox="0 0 96 96" className={frame} aria-hidden>
      <rect x="12" y="26" width="72" height="50" className="fill-accent/10 stroke-accent" strokeWidth="3" />
      <path d="M12 38h72" className="stroke-accent" strokeWidth="3" />
      <rect x="58" y="50" width="26" height="16" className="fill-bg stroke-accent" strokeWidth="3" />
      <circle cx="68" cy="58" r="3.5" className="fill-accent" />
      <path d="M22 26 62 12l6 14" className="stroke-accent" strokeWidth="3" fill="none" strokeLinejoin="round" />
    </svg>
  );
}
/** Step 3: verify in the log. */
export function StepVerifyArt() {
  return (
    <svg viewBox="0 0 96 96" className={frame} aria-hidden>
      <rect x="10" y="12" width="56" height="66" className="fill-accent/10 stroke-accent" strokeWidth="3" />
      {[28, 42, 56].map((y) => <path key={y} d={`M20 ${y}h30`} className="stroke-accent" strokeWidth="3" strokeLinecap="round" />)}
      <circle cx="64" cy="62" r="17" className="fill-bg stroke-accent" strokeWidth="3" />
      <path d="M57 62l5 5 9-10" className="stroke-ok" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M76 75l10 10" className="stroke-accent" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

/** Compare panels. */
export function ExposedArt() {
  return (
    <svg viewBox="0 0 160 96" className="h-24 w-40" aria-hidden>
      {[34, 50, 66].map((r, i) => <circle key={r} cx="80" cy="48" r={r} className="stroke-bad" fill="none" strokeWidth="1.5" opacity={0.5 - i * 0.14} />)}
      <path d="M32 48c12-18 28-28 48-28s36 10 48 28c-12 18-28 28-48 28S44 66 32 48z" className="fill-bad/10 stroke-bad" strokeWidth="3" strokeLinejoin="round" />
      <circle cx="80" cy="48" r="12" className="fill-bad" />
      <circle cx="84" cy="44" r="4" className="fill-bg" />
    </svg>
  );
}
export function VeiledArt() {
  return (
    <svg viewBox="0 0 160 96" className="h-24 w-40" aria-hidden>
      <path d="M80 8 124 24v26c0 22-18 34-44 44-26-10-44-22-44-44V24z" className="fill-accent/15 stroke-accent" strokeWidth="3" strokeLinejoin="round" />
      <path d="M58 50c6-10 14-15 22-15s16 5 22 15c-6 10-14 15-22 15S64 60 58 50z" className="stroke-accent" fill="none" strokeWidth="3" strokeLinejoin="round" />
      <path d="M62 70 98 30" className="stroke-bg" strokeWidth="8" strokeLinecap="round" />
      <path d="M62 70 98 30" className="stroke-accent" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** Feature art. */
const featureBox = "h-20 w-20 shrink-0";
export function FeatureArt({ kind }: { kind: "lock" | "layers" | "key" | "list" }) {
  if (kind === "lock") return (
    <svg viewBox="0 0 80 80" className={featureBox} aria-hidden>
      <path d="M26 36V26a14 14 0 0 1 28 0v10" fill="none" className="stroke-accent" strokeWidth="4" />
      <rect x="16" y="36" width="48" height="34" className="fill-accent/15 stroke-accent" strokeWidth="4" />
      <circle cx="40" cy="52" r="5" className="fill-accent" />
    </svg>
  );
  if (kind === "layers") return (
    <svg viewBox="0 0 80 80" className={featureBox} aria-hidden>
      <path d="M40 12 70 28 40 44 10 28z" className="fill-accent/25 stroke-accent" strokeWidth="3" strokeLinejoin="round" />
      <path d="M10 40 40 56 70 40" fill="none" className="stroke-accent" strokeWidth="3" strokeLinejoin="round" />
      <path d="M10 52 40 68 70 52" fill="none" className="stroke-accent" strokeWidth="3" strokeLinejoin="round" opacity=".6" />
    </svg>
  );
  if (kind === "key") return (
    <svg viewBox="0 0 80 80" className={featureBox} aria-hidden>
      <circle cx="28" cy="40" r="16" className="fill-accent/15 stroke-accent" strokeWidth="4" />
      <circle cx="28" cy="40" r="5" className="fill-accent" />
      <path d="M44 40h28M62 40v10M54 40v7" className="stroke-accent" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
  return (
    <svg viewBox="0 0 80 80" className={featureBox} aria-hidden>
      <rect x="14" y="12" width="52" height="56" className="fill-accent/10 stroke-accent" strokeWidth="4" />
      {[26, 40, 54].map((y) => <g key={y}><circle cx="26" cy={y} r="3" className="fill-accent" /><path d={`M36 ${y}h20`} className="stroke-accent" strokeWidth="4" strokeLinecap="round" /></g>)}
    </svg>
  );
}

/** Closing section. */
export function ShieldArt() {
  return (
    <svg viewBox="0 0 240 240" className="h-56 w-56" aria-hidden>
      {[110, 90, 70].map((r, i) => <circle key={r} cx="120" cy="120" r={r} fill="none" className="stroke-accent line-flow" strokeWidth="1.5" strokeDasharray="4 8" opacity={0.55 - i * 0.12} style={{ animationDelay: `${i * 0.5}s` }} />)}
      <path d="M120 40 176 62v52c0 34-22 56-56 70-34-14-56-36-56-70V62z" className="fill-accent/20 stroke-accent" strokeWidth="4" strokeLinejoin="round" />
      <path d="M92 118l20 20 38-42" fill="none" className="stroke-accent" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
