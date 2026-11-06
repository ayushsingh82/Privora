"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import { zeroAddress, type Address } from "viem";
import { anonStore, type AnonState } from "./anon-rpc/manager";
import { walletStore, type WalletState } from "./ethereum/wallet";
import { readClient } from "./ethereum/read-client";
import { CHAIN } from "./ethereum/chains";
import { erc20Abi, factoryAbi, pairAbi, routerAbi } from "./uniswap/abis";
import { DEFAULT_TOKENS, lookupToken, wrapped, type Token } from "./tokens";

export const useAnon = (): AnonState => useSyncExternalStore(anonStore.subscribe, anonStore.getSnapshot, anonStore.getSnapshot);
export const useWallet = (): WalletState => useSyncExternalStore(walletStore.subscribe, walletStore.getSnapshot, walletStore.getSnapshot);

/** Reads only run when the active transport is usable. In Anon-RPC mode that means the worker is ready (fail closed). */
export function useReadsReady() {
  const a = useAnon();
  return { ready: a.mode === "direct" || a.status === "ready", mode: a.mode };
}

export function useTokenBalance(token: Token | null, owner: Address | null) {
  const { ready, mode } = useReadsReady();
  return useQuery({
    queryKey: ["balance", mode, CHAIN.id, token?.address, owner],
    enabled: ready && !!token && !!owner,
    queryFn: async () =>
      token!.native
        ? readClient.getBalance({ address: owner! })
        : readClient.readContract({ address: token!.address, abi: erc20Abi, functionName: "balanceOf", args: [owner!] }),
  });
}

export function useAllowance(token: Token | null, owner: Address | null, spender: Address) {
  const { ready, mode } = useReadsReady();
  return useQuery({
    queryKey: ["allowance", mode, CHAIN.id, token?.address, owner, spender],
    enabled: ready && !!token && !token.native && !!owner,
    queryFn: () => readClient.readContract({ address: token!.address, abi: erc20Abi, functionName: "allowance", args: [owner!, spender] }),
  });
}

export function usePair(a: Token | null, b: Token | null) {
  const { ready, mode } = useReadsReady();
  const A = a ? wrapped(a) : null;
  const B = b ? wrapped(b) : null;
  return useQuery({
    queryKey: ["pair", mode, CHAIN.id, A, B],
    enabled: ready && !!A && !!B && A !== B,
    queryFn: async () => {
      const pair = await readClient.readContract({ address: CHAIN.factory, abi: factoryAbi, functionName: "getPair", args: [A!, B!] });
      if (pair === zeroAddress) return null;
      const [token0, reserves, supply] = await Promise.all([
        readClient.readContract({ address: pair, abi: pairAbi, functionName: "token0" }),
        readClient.readContract({ address: pair, abi: pairAbi, functionName: "getReserves" }),
        readClient.readContract({ address: pair, abi: pairAbi, functionName: "totalSupply" }),
      ]);
      const aIs0 = token0.toLowerCase() === A!.toLowerCase();
      return { pair, reserveA: aIs0 ? reserves[0] : reserves[1], reserveB: aIs0 ? reserves[1] : reserves[0], totalSupply: supply };
    },
  });
}

export function useLpBalance(pair: Address | null | undefined, owner: Address | null) {
  const { ready, mode } = useReadsReady();
  return useQuery({
    queryKey: ["lp", mode, CHAIN.id, pair, owner],
    enabled: ready && !!pair && !!owner,
    queryFn: () => readClient.readContract({ address: pair!, abi: pairAbi, functionName: "balanceOf", args: [owner!] }),
  });
}

/** Best of direct pair vs. via-WETH path, quoted by the router's own getAmountsOut. */
export function useQuote(from: Token | null, to: Token | null, amountIn: bigint) {
  const { ready, mode } = useReadsReady();
  return useQuery({
    queryKey: ["quote", mode, CHAIN.id, from?.address, to?.address, amountIn.toString()],
    enabled: ready && !!from && !!to && amountIn > 0n && wrapped(from!) !== wrapped(to!),
    retry: false,
    queryFn: async () => {
      const a = wrapped(from!), b = wrapped(to!);
      const paths: Address[][] = [[a, b]];
      if (a !== CHAIN.weth && b !== CHAIN.weth) paths.push([a, CHAIN.weth, b]);
      // Both candidate routes in ONE request (Multicall3), quoted by the router's own getAmountsOut.
      const r = await readClient.multicall({
        multicallAddress: "0xcA11bde05977b3631167028862bE2a173976CA11",
        allowFailure: true,
        contracts: paths.map((path) => ({ address: CHAIN.router, abi: routerAbi, functionName: "getAmountsOut", args: [amountIn, path] }) as const),
      });
      const results = r.map((x, i) => (x.status === "success" ? { path: paths[i], out: (x.result as readonly bigint[])[(x.result as readonly bigint[]).length - 1] } : null));
      const best = results.filter((r): r is { path: Address[]; out: bigint } => !!r && r.out > 0n).sort((x, y) => (x.out > y.out ? -1 : 1))[0];
      if (!best) throw new Error("No route: no Uniswap V2 pool (or no liquidity) for this pair");
      return best;
    },
  });
}

/** Pre-select tokens from ?a=&b= (or ?from=&to=) links. Metadata is validated onchain via lookupToken. */
export function useUrlTokens(set: (slot: 0 | 1, t: Token) => void) {
  const { ready } = useReadsReady();
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!ready || done || typeof window === "undefined") return;
    setDone(true);
    const p = new URLSearchParams(window.location.search);
    ([[0, p.get("a") ?? p.get("from")], [1, p.get("b") ?? p.get("to")]] as const).forEach(([slot, addr]) => {
      if (!addr) return;
      const known = DEFAULT_TOKENS.find((t) => t.address.toLowerCase() === addr.toLowerCase());
      if (known) set(slot, known);
      else lookupToken(addr).then((t) => set(slot, t)).catch(() => {});
    });
  }, [ready, done, set]);
}
