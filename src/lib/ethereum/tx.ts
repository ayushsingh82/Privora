// Transaction flow: SUBMIT through the wallet (write path, not anonymised), then POLL the receipt through the read
// path (follows the selected privacy mode). The two transports are never mixed.
import type { Hash } from "viem";
import { readClient } from "./read-client";

export type TxState =
  | { phase: "idle" }
  | { phase: "wallet"; label: string }
  | { phase: "pending"; label: string; hash: Hash }
  | { phase: "done"; label: string; hash: Hash }
  | { phase: "error"; label: string; message: string; hash?: Hash };

export async function runTx(label: string, send: () => Promise<Hash>, set: (s: TxState) => void): Promise<boolean> {
  let hash: Hash | undefined;
  try {
    set({ phase: "wallet", label });
    hash = await send();
    set({ phase: "pending", label, hash });
    const r = await readClient.waitForTransactionReceipt({ hash, pollingInterval: 4_000, timeout: 180_000 });
    if (r.status !== "success") throw new Error("Transaction reverted");
    set({ phase: "done", label, hash });
    return true;
  } catch (e) {
    const m = e instanceof Error ? (e as { shortMessage?: string }).shortMessage ?? e.message : String(e);
    set({ phase: "error", label, message: m.slice(0, 240), hash });
    return false;
  }
}

/**
 * Picks the first candidate whose simulation (an eth_call through the READ transport) succeeds, so a doomed
 * transaction is never sent to the wallet. Throws the LAST candidate's error if none succeed (the most specific one).
 */
export async function firstValid<A>(cands: A[], sim: (a: A) => Promise<unknown>): Promise<A> {
  let last: unknown;
  for (const c of cands) {
    try { await sim(c); return c; } catch (e) { last = e; }
  }
  throw last;
}

/** Gas estimate (+30%) via the READ transport. Tokens with transfer fees/hooks routinely under-estimate; undefined = let the wallet decide. */
export async function bufferedGas(est: () => Promise<bigint>): Promise<bigint | undefined> {
  try { return ((await est()) * 130n) / 100n; } catch { return undefined; }
}
