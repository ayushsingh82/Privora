"use client";
import Link from "next/link";
import { useState } from "react";
import { formatUnits } from "viem";
import { CHAIN } from "@/lib/ethereum/chains";
import type { Pool } from "@/lib/uniswap/pools";
import TokenIcon, { PairIcons } from "./TokenIcon";

export const POOL_COLS = "md:grid-cols-[minmax(0,1.5fr)_minmax(0,1.3fr)_minmax(0,1.3fr)_minmax(0,.8fr)_auto]";
const f = (v: bigint, d: number) => Number(formatUnits(v, d)).toLocaleString(undefined, { maximumFractionDigits: 4 });
const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;
const sig = (n: number) => n.toLocaleString(undefined, { maximumSignificantDigits: 5 });

/** One pool as a table row. Addresses are tucked behind the chevron. */
export default function PoolCard({ p: raw, index = 0 }: { p: Pool; index?: number }) {
  // Read the pool the way people say it: "USDC / WETH", not "WETH / USDC".
  const flip = raw.token0.address.toLowerCase() === CHAIN.weth.toLowerCase();
  const p: Pool = flip ? { ...raw, token0: raw.token1, token1: raw.token0, reserve0: raw.reserve1, reserve1: raw.reserve0 } : raw;
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const r0 = Number(formatUnits(p.reserve0, p.token0.decimals));
  const r1 = Number(formatUnits(p.reserve1, p.token1.decimals));
  const price = r0 > 0 && r1 > 0 ? r1 / r0 : null;
  const empty = p.reserve0 === 0n || p.reserve1 === 0n;
  const copy = () => navigator.clipboard?.writeText(p.pair).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }).catch(() => {});
  const Label = ({ children }: { children: React.ReactNode }) => <div className="mb-1 text-[11px] uppercase tracking-wider text-muted md:hidden">{children}</div>;

  return (
    <div style={{ ["--d" as string]: `${Math.min(index, 10) * 70}ms` }} className="fade-up transition-colors hover:bg-card2/30">
      <div className={`grid items-center gap-x-6 gap-y-4 p-4 ${POOL_COLS}`}>
        <div className="flex items-center gap-3">
          <PairIcons a={p.token0} b={p.token1} />
          <div className="min-w-0">
            <div className="truncate font-semibold">{p.token0.symbol} / {p.token1.symbol}</div>
            <div className="mt-0.5 flex gap-1.5 text-[11px] text-muted">
              <span className="rounded bg-card2 px-1.5 py-0.5">V2</span>
              <span className="rounded bg-card2 px-1.5 py-0.5">0.3%</span>
              {empty && <span className="rounded bg-bad/15 px-1.5 py-0.5 text-bad">Empty</span>}
            </div>
          </div>
        </div>

        <div className="text-sm">
          <Label>Price</Label>
          {price === null ? "–" : (
            <>
              <div className="mono">1 {p.token0.symbol} = {sig(price)} {p.token1.symbol}</div>
              <div className="mono mt-0.5 text-xs text-muted">1 {p.token1.symbol} = {sig(1 / price)} {p.token0.symbol}</div>
            </>
          )}
        </div>

        <div className="space-y-1 text-sm">
          <Label>Reserves</Label>
          {[{ t: p.token0, v: p.reserve0 }, { t: p.token1, v: p.reserve1 }].map(({ t, v }) => (
            <div key={t.address} className="flex items-center gap-2">
              <TokenIcon symbol={t.symbol} address={t.address} size={16} />
              <span className="mono truncate" title={f(v, t.decimals)}>{f(v, t.decimals)}</span>
              <span className="text-xs text-muted">{t.symbol}</span>
            </div>
          ))}
        </div>

        <div className="text-sm">
          <Label>LP supply</Label>
          <span className="mono">{f(p.totalSupply, 18)}</span>
        </div>

        <div className="flex items-center gap-2 text-sm font-semibold">
          <Link href={`/swap?from=${p.token0.address}&to=${p.token1.address}`} className="rounded-none bg-accent px-4 py-2 text-accent-fg transition hover:brightness-110">Swap</Link>
          <Link href={`/liquidity?a=${p.token0.address}&b=${p.token1.address}`} className="rounded-none bg-card2 px-4 py-2 transition hover:bg-line">Add</Link>
          <button onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="Pool details" className="grid h-9 w-9 place-items-center rounded-none text-muted transition hover:bg-card2 hover:text-fg">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition ${open ? "rotate-180" : ""}`}><path d="M4 6l4 4 4-4" /></svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="mono flex flex-wrap gap-x-8 gap-y-2 bg-card2/40 px-4 py-3 text-xs text-muted">
          <span>Pool <a className="text-fg underline" href={`${CHAIN.explorer}/address/${p.pair}`} target="_blank" rel="noreferrer">{short(p.pair)}</a>{" "}<button onClick={copy} className="ml-1 rounded bg-card2 px-1.5 py-0.5 text-[10px] hover:bg-line">{copied ? "Copied" : "Copy"}</button></span>
          {[p.token0, p.token1].map((t) => <span key={t.address}>{t.symbol} <a className="text-fg underline" href={`${CHAIN.explorer}/token/${t.address}`} target="_blank" rel="noreferrer">{short(t.address)}</a></span>)}
        </div>
      )}
    </div>
  );
}
