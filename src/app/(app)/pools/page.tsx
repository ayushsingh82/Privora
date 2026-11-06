"use client";
import { useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { CHAIN } from "@/lib/ethereum/chains";
import { featuredPools, findPool, recentPairs } from "@/lib/uniswap/pools";
import { DEFAULT_TOKENS, FEATURED_TOKENS } from "@/lib/tokens";
import TokenIcon from "@/components/TokenIcon";
import { useReadsReady } from "@/lib/hooks";
import { friendly, isPrivacyBlock } from "@/lib/errors";
import PoolCard, { POOL_COLS } from "@/components/PoolCard";
import type { Pool } from "@/lib/uniswap/pools";

function PoolTable({ pools }: { pools: Pool[] }) {
  return (
    <div className="overflow-hidden rounded-none border border-line bg-card">
      <div className={`hidden gap-x-6 border-b border-line px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-muted md:grid ${POOL_COLS}`}>
        <span>Pool</span><span>Price</span><span>Reserves</span><span>LP supply</span><span className="w-[10.5rem]" />
      </div>
      <div className="divide-y divide-line">{pools.map((p, i) => <PoolCard key={p.pair} p={p} index={i % 6} />)}</div>
    </div>
  );
}

const PAGE = 6;

const isAddr = (v: string) => /^0x[0-9a-fA-F]{40}$/.test(v.trim());

/** One smart box: type a symbol or name, or paste a token / pool address. Optional second token to look up a specific pair. */
function PoolSearch({ onSearch, busy }: { onSearch: (a: string, b: string) => void; busy: boolean }) {
  const [q, setQ] = useState("");
  const [q2, setQ2] = useState("");
  const [two, setTwo] = useState(false);
  const [open, setOpen] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const find = (v: string) => { const l = v.trim().toLowerCase(); return l ? DEFAULT_TOKENS.filter((t) => !t.native && (t.symbol.toLowerCase().includes(l) || t.name.toLowerCase().includes(l))) : []; };
  const matches = isAddr(q) ? [] : find(q).slice(0, 6);
  const toAddr = (v: string) => (isAddr(v) ? v.trim() : find(v)[0]?.address ?? "");
  const run = (a: string) => {
    const b2 = two && q2.trim() ? toAddr(q2) : "";
    if (two && q2.trim() && !b2) { setHint("Second token not found. Pick a symbol from the list or paste an address."); return; }
    setHint(null); setOpen(false); onSearch(a, b2);
  };
  const submit = () => {
    const a = toAddr(q);
    if (!a) { setHint(q.trim() ? "No match. Try USDC or LINK, or paste a token or pool address." : "Type a token or paste an address."); return; }
    if (!isAddr(q)) setQ(find(q)[0].symbol);
    run(a);
  };
  const box = "w-full border border-line bg-card2 py-3 pl-11 pr-10 text-sm outline-none placeholder:text-muted/60";
  return (
    <div className="border border-line bg-card p-5">
      <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <svg className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input value={q} onChange={(e) => { setQ(e.target.value); setHint(null); setOpen(true); }} onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)} placeholder="Search a token or paste an address" className={box} aria-label="Search pools" autoComplete="off" spellCheck={false} />
          {q && <button type="button" onClick={() => { setQ(""); setHint(null); }} aria-label="Clear" className="absolute right-3 top-1/2 -translate-y-1/2 px-1 text-muted hover:text-fg">✕</button>}
          {open && matches.length > 0 && (
            <ul className="absolute left-0 right-0 top-full z-20 mt-1 border border-line bg-card shadow-2xl shadow-black/60">
              {matches.map((t) => (
                <li key={t.address}>
                  <button type="button" onMouseDown={(e) => { e.preventDefault(); setQ(t.symbol); run(t.address); }} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-card2">
                    <TokenIcon symbol={t.symbol} address={t.address} size={28} />
                    <span className="font-medium">{t.symbol}</span><span className="truncate text-sm text-muted">{t.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button disabled={!q.trim() || busy} className="bg-accent px-8 py-3 text-sm font-semibold text-accent-fg transition hover:brightness-110 disabled:opacity-40">{busy ? "Searching…" : "Search"}</button>
      </form>

      {two && (
        <div className="relative mt-3">
          <input value={q2} onChange={(e) => { setQ2(e.target.value); setHint(null); }} placeholder="Second token: symbol or address (default WETH)" className={`${box} pl-4`} aria-label="Second token" autoComplete="off" spellCheck={false} />
        </div>
      )}
      {hint && <p className="mt-3 text-sm text-bad">{hint}</p>}

      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-xs uppercase tracking-wider text-muted">Popular</span>
        {FEATURED_TOKENS.map((t) => (
          <button key={t.address} type="button" onClick={() => { setQ(t.symbol); setHint(null); run(t.address); }} className="flex items-center gap-2 border border-line bg-card2 py-1.5 pl-1.5 pr-3 font-medium hover:bg-line">
            <TokenIcon symbol={t.symbol} address={t.address} size={20} />{t.symbol}
          </button>
        ))}
        <button type="button" onClick={() => { setTwo((v) => !v); setQ2(""); setHint(null); }} className="ml-auto text-xs text-muted hover:text-fg">{two ? "Remove second token" : "Pair with another token"}</button>
      </div>
    </div>
  );
}



export default function Pools() {
  const { ready, mode } = useReadsReady();
  const [submitted, setSubmitted] = useState<{ a: string; b: string } | null>(null);

  const list = useInfiniteQuery({
    queryKey: ["pools", mode, CHAIN.id],
    enabled: ready,
    initialPageParam: 0,
    queryFn: ({ pageParam }) => recentPairs(pageParam, PAGE),
    getNextPageParam: (last, all) => (all.length * PAGE < last.total ? all.length * PAGE : undefined),
  });
  const featured = useQuery({
    queryKey: ["featured-pools", mode, CHAIN.id],
    enabled: ready,
    queryFn: () => featuredPools(FEATURED_TOKENS),
  });
  const found = useQuery({
    queryKey: ["pool-search", mode, CHAIN.id, submitted],
    enabled: ready && !!submitted,
    retry: false,
    queryFn: () => findPool(submitted!.a.trim(), submitted!.b.trim()),
  });
  const total = list.data?.pages[0]?.total;

  return (
    <div className="space-y-8">
      <div className="fade-up flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Pools</h1>
          <p className="mt-1 text-sm text-muted">Live Uniswap V2 pairs on {CHAIN.name}. Every number is read from chain via the active transport.</p>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="rounded-md border border-line bg-card px-3 py-1.5"><span className="text-muted">Pairs </span><span className="mono font-semibold">{total ? total.toLocaleString() : "–"}</span></span>
          <span className="rounded-md border border-line bg-card px-3 py-1.5"><span className="text-muted">Fee </span><span className="mono font-semibold">0.3%</span></span>
        </div>
      </div>

      <PoolSearch busy={found.isFetching} onSearch={(a, b) => setSubmitted({ a, b })} />

      {submitted && (
        <div>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted">Search result</h2>
          {found.isFetching && <p className="text-sm text-muted">Searching…</p>}
          {found.isError && <p className={`text-sm ${isPrivacyBlock(found.error) ? "text-muted" : "text-bad"}`}>{friendly(found.error)}</p>}
          {found.data === null && !found.isFetching && <p className="text-sm text-muted">No Uniswap V2 pool exists for this pair.</p>}
          {found.data && <PoolTable pools={[found.data]} />}
        </div>
      )}

      <div>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted">Featured pools</h2>
        {!ready || (featured.isFetching && !featured.data) ? (
          <div className="space-y-2">{[0, 1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-16" />)}</div>
        ) : featured.data && featured.data.length > 0 ? (
          <PoolTable pools={featured.data} />
        ) : (
          <p className="text-sm text-muted">No featured pools found on this network.</p>
        )}
      </div>

      <div>
        <h2 className="mb-1 text-sm font-medium uppercase tracking-wider text-muted">Newest pairs</h2>
        <p className="mb-3 text-xs text-muted">Created by anyone on {CHAIN.name}, so many are throwaway test tokens.</p>
        {!ready && (
          <div className="space-y-2">
            <p className="text-sm text-muted">Waiting for the read transport...</p>
            {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="skeleton h-16" />)}
          </div>
        )}
        {list.isError && ready && (
          <div className="flex flex-wrap items-center gap-3">
            <p className={`text-sm ${isPrivacyBlock(list.error) ? "text-muted" : "text-bad"}`}>{friendly(list.error)}</p>
            <button onClick={() => list.refetch()} className="rounded-md bg-card2 px-3 py-1.5 text-xs font-semibold hover:bg-line">Retry</button>
          </div>
        )}
        {!!list.data && <PoolTable pools={list.data.pages.flatMap((p) => p.pools)} />}
        {list.isFetching && !list.data && ready && <div className="space-y-2">{[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="skeleton h-16" />)}</div>}
        {list.isFetching && !!list.data && <p className="mt-3 text-sm text-muted">Loading more…</p>}
        {list.hasNextPage && !list.isFetching && <button onClick={() => list.fetchNextPage()} className="mt-4 rounded-none border border-line px-4 py-2 text-sm">Load more</button>}
      </div>
    </div>
  );
}
