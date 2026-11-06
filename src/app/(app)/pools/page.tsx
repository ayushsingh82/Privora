"use client";
import { useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { CHAIN } from "@/lib/ethereum/chains";
import { featuredPools, findPool, recentPairs } from "@/lib/uniswap/pools";
import { FEATURED_TOKENS } from "@/lib/tokens";
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

export default function Pools() {
  const { ready, mode } = useReadsReady();
  const [a, setA] = useState("");
  const [b, setB] = useState("");
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

      <form onSubmit={(e) => { e.preventDefault(); setSubmitted({ a, b }); }} className="grid gap-3 rounded-none border border-line bg-card p-5 md:grid-cols-[1fr_1fr_auto]">
        <input value={a} onChange={(e) => setA(e.target.value)} placeholder="Token address (or pair address)" className="mono rounded-none border border-line bg-card2 px-3 py-2 text-sm outline-none" />
        <input value={b} onChange={(e) => setB(e.target.value)} placeholder="Second token (optional, defaults to WETH)" className="mono rounded-none border border-line bg-card2 px-3 py-2 text-sm outline-none" />
        <button disabled={!a} className="rounded-none bg-accent px-5 py-2 text-sm font-semibold text-accent-fg disabled:opacity-50">Search</button>
      </form>

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
