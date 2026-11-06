"use client";
import { useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { CHAIN } from "@/lib/ethereum/chains";
import { findPool, recentPairs } from "@/lib/uniswap/pools";
import { useReadsReady } from "@/lib/hooks";
import PoolCard from "@/components/PoolCard";

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
  const found = useQuery({
    queryKey: ["pool-search", mode, CHAIN.id, submitted],
    enabled: ready && !!submitted,
    retry: false,
    queryFn: () => findPool(submitted!.a.trim(), submitted!.b.trim()),
  });
  const total = list.data?.pages[0]?.total;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Pools</h1>
        <p className="mt-1 text-sm text-muted">Live Uniswap V2 pairs on {CHAIN.name}{total ? ` — ${total.toLocaleString()} pairs in the factory` : ""}. Every number is read from chain via the active transport.</p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); setSubmitted({ a, b }); }} className="grid gap-2 rounded-2xl border border-line bg-card p-4 md:grid-cols-[1fr_1fr_auto]">
        <input value={a} onChange={(e) => setA(e.target.value)} placeholder="Token address (or pair address)" className="mono rounded-xl border border-line bg-card2 px-3 py-2 text-sm outline-none focus:border-accent" />
        <input value={b} onChange={(e) => setB(e.target.value)} placeholder="Second token (optional, defaults to WETH)" className="mono rounded-xl border border-line bg-card2 px-3 py-2 text-sm outline-none focus:border-accent" />
        <button disabled={!a} className="rounded-xl bg-accent px-5 py-2 text-sm font-semibold text-accent-fg disabled:opacity-50">Search</button>
      </form>

      {submitted && (
        <div>
          <h2 className="mb-2 text-sm font-medium text-muted">Search result</h2>
          {found.isFetching && <p className="text-sm text-muted">Searching…</p>}
          {found.isError && <p className="text-sm text-bad">{(found.error as Error).message}</p>}
          {found.data === null && !found.isFetching && <p className="text-sm text-muted">No Uniswap V2 pool exists for this pair.</p>}
          {found.data && <div className="max-w-xl"><PoolCard p={found.data} /></div>}
        </div>
      )}

      <div>
        <h2 className="mb-2 text-sm font-medium text-muted">Newest pairs</h2>
        {!ready && <p className="text-sm text-muted">Waiting for the read transport…</p>}
        {list.isError && <p className="text-sm text-bad">{(list.error as Error).message}</p>}
        <div className="grid gap-3 md:grid-cols-2">{list.data?.pages.flatMap((p) => p.pools).map((p) => <PoolCard key={p.pair} p={p} />)}</div>
        {list.isFetching && <p className="mt-3 text-sm text-muted">Loading…</p>}
        {list.hasNextPage && !list.isFetching && <button onClick={() => list.fetchNextPage()} className="mt-4 rounded-xl border border-line px-4 py-2 text-sm hover:border-accent">Load more</button>}
      </div>
    </div>
  );
}
