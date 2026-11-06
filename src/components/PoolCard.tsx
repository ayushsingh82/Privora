"use client";
import Link from "next/link";
import { formatUnits } from "viem";
import { CHAIN } from "@/lib/ethereum/chains";
import type { Pool } from "@/lib/uniswap/pools";

const f = (v: bigint, d: number) => Number(formatUnits(v, d)).toLocaleString(undefined, { maximumFractionDigits: 4 });

export default function PoolCard({ p }: { p: Pool }) {
  const price = p.reserve0 > 0n && p.reserve1 > 0n ? Number(formatUnits(p.reserve1, p.token1.decimals)) / Number(formatUnits(p.reserve0, p.token0.decimals)) : null;
  return (
    <div className="rounded-2xl border border-line bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-lg font-semibold">{p.token0.symbol} / {p.token1.symbol}</div>
        <div className="flex gap-2 text-xs">
          <Link href={`/liquidity?a=${p.token0.address}&b=${p.token1.address}`} className="rounded-lg border border-line px-2.5 py-1 hover:border-white/30">Add liquidity</Link>
          <Link href={`/?from=${p.token0.address}&to=${p.token1.address}`} className="rounded-lg border border-line px-2.5 py-1 hover:border-white/30">Swap</Link>
        </div>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted">
        <dt>Reserve {p.token0.symbol}</dt><dd className="mono text-right text-fg">{f(p.reserve0, p.token0.decimals)}</dd>
        <dt>Reserve {p.token1.symbol}</dt><dd className="mono text-right text-fg">{f(p.reserve1, p.token1.decimals)}</dd>
        <dt>Price</dt><dd className="mono text-right text-fg">{price === null ? "–" : `1 ${p.token0.symbol} = ${price.toLocaleString(undefined, { maximumSignificantDigits: 6 })} ${p.token1.symbol}`}</dd>
        <dt>LP supply</dt><dd className="mono text-right text-fg">{f(p.totalSupply, 18)}</dd>
      </dl>
      <div className="mono mt-3 break-all text-[10px] text-muted">
        Pool <a className="underline" href={`${CHAIN.explorer}/address/${p.pair}`} target="_blank" rel="noreferrer">{p.pair}</a>
      </div>
      <div className="mono mt-1 break-all text-[10px] text-muted">{p.token0.symbol}: {p.token0.address}<br />{p.token1.symbol}: {p.token1.address}</div>
    </div>
  );
}
