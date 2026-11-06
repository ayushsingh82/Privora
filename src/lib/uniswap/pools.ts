// Pool discovery/reads. Everything goes through readClient (so through the active privacy transport).
// Multicall3 batches many contract reads into ONE eth_call — important on a mixnet where each request is slow.
import { getAddress, isAddress, zeroAddress, type Address } from "viem";
import { readClient } from "../ethereum/read-client";
import { CHAIN } from "../ethereum/chains";
import { erc20Abi, factoryAbi, pairAbi } from "./abis";
import { type Token } from "../tokens";

const multicallAddress: Address = "0xcA11bde05977b3631167028862bE2a173976CA11";
const clean = (s: string) => s.replace(/[^\x20-\x7E]/g, "").slice(0, 16) || "?";

export interface Pool {
  pair: Address;
  token0: Token;
  token1: Token;
  reserve0: bigint;
  reserve1: bigint;
  totalSupply: bigint;
}

async function tokenMeta(addrs: Address[]): Promise<Map<string, Token>> {
  const calls = addrs.flatMap((address) => [
    { address, abi: erc20Abi, functionName: "symbol" } as const,
    { address, abi: erc20Abi, functionName: "name" } as const,
    { address, abi: erc20Abi, functionName: "decimals" } as const,
  ]);
  const r = await readClient.multicall({ contracts: calls, multicallAddress, allowFailure: true });
  const m = new Map<string, Token>();
  addrs.forEach((address, i) => {
    const [s, n, d] = [r[i * 3], r[i * 3 + 1], r[i * 3 + 2]];
    // Some legacy tokens (e.g. bytes32 symbols) fail to decode — show a short address instead of trusting garbage.
    m.set(address, {
      address,
      symbol: s.status === "success" ? clean(String(s.result)) : `${address.slice(0, 6)}…`,
      name: n.status === "success" ? clean(String(n.result)) : "Unknown token",
      decimals: d.status === "success" && Number(d.result) <= 36 ? Number(d.result) : 18,
    });
  });
  return m;
}

export async function fetchPools(pairs: Address[]): Promise<Pool[]> {
  if (!pairs.length) return [];
  const calls = pairs.flatMap((address) => [
    { address, abi: pairAbi, functionName: "token0" } as const,
    { address, abi: pairAbi, functionName: "token1" } as const,
    { address, abi: pairAbi, functionName: "getReserves" } as const,
    { address, abi: pairAbi, functionName: "totalSupply" } as const,
  ]);
  const r = await readClient.multicall({ contracts: calls, multicallAddress, allowFailure: true });
  const raw = pairs.map((pair, i) => ({ pair, t0: r[i * 4], t1: r[i * 4 + 1], res: r[i * 4 + 2], ts: r[i * 4 + 3] }));
  const ok = raw.filter((x) => x.t0.status === "success" && x.t1.status === "success" && x.res.status === "success" && x.ts.status === "success");
  const tokens = [...new Set(ok.flatMap((x) => [x.t0.result as Address, x.t1.result as Address]))];
  const meta = await tokenMeta(tokens);
  return ok.map((x) => {
    const res = x.res.result as readonly [bigint, bigint, number];
    return {
      pair: x.pair,
      token0: meta.get(x.t0.result as Address)!,
      token1: meta.get(x.t1.result as Address)!,
      reserve0: res[0],
      reserve1: res[1],
      totalSupply: x.ts.result as bigint,
    };
  });
}

export async function recentPairs(offset: number, count: number): Promise<{ total: number; pools: Pool[] }> {
  const total = Number(await readClient.readContract({ address: CHAIN.factory, abi: factoryAbi, functionName: "allPairsLength" }));
  const hi = total - offset;
  const idx = Array.from({ length: Math.max(0, Math.min(count, hi)) }, (_, i) => BigInt(hi - 1 - i));
  const addrs = await readClient.multicall({
    contracts: idx.map((i) => ({ address: CHAIN.factory, abi: factoryAbi, functionName: "allPairs", args: [i] }) as const),
    multicallAddress,
    allowFailure: false,
  });
  return { total, pools: await fetchPools(addrs as Address[]) };
}

/** Look up by pair address, or by two token addresses (B defaults to WETH). */
export async function findPool(a: string, b: string): Promise<Pool | null> {
  if (!isAddress(a)) throw new Error("Enter a valid address");
  const A = getAddress(a);
  // A pair address? (it answers token0())
  if (!b) {
    const asPair = await fetchPools([A]).catch(() => []);
    if (asPair.length) return asPair[0];
  }
  const B = b ? (isAddress(b) ? getAddress(b) : null) : CHAIN.weth;
  if (!B) throw new Error("Second address is invalid");
  const pair = await readClient.readContract({ address: CHAIN.factory, abi: factoryAbi, functionName: "getPair", args: [A, B] });
  if (pair === zeroAddress) return null;
  return (await fetchPools([pair]))[0] ?? null;
}
