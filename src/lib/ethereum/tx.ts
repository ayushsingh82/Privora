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
