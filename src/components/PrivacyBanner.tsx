"use client";
import { useAnon, useWallet } from "@/lib/hooks";
import { CHAIN } from "@/lib/ethereum/chains";
import { setReadMode, startWorker } from "@/lib/anon-rpc/manager";
import { switchToAppChain } from "@/lib/ethereum/wallet";

/** Visible, honest status. In Anon-RPC mode a dead worker is an error, never a silent switch to direct RPC. */
export default function PrivacyBanner() {
  const a = useAnon();
  const w = useWallet();
  const wrongChain = w.address && w.chainId !== null && w.chainId !== CHAIN.id;
  return (
    <div className="mx-auto w-full max-w-6xl space-y-2 px-4 pt-3">
      {a.mode === "anon" && a.status === "failed" && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-bad/40 bg-bad/10 px-4 py-3 text-sm">
          <span className="font-medium text-bad">Anon-RPC unavailable — reads are blocked.</span>
          <span className="text-muted">{a.error}. PrivateSwap will not fall back to direct RPC on its own.</span>
          <span className="ml-auto flex gap-2">
            <button onClick={() => startWorker().catch(() => {})} className="rounded-lg border border-line px-3 py-1 hover:border-accent">Retry</button>
            <button onClick={() => setReadMode("direct")} className="rounded-lg border border-line px-3 py-1 hover:border-accent">Use Standard RPC</button>
          </span>
        </div>
      )}
      {a.mode === "anon" && a.status === "starting" && (
        <div className="rounded-xl border border-line bg-card px-4 py-3 text-sm text-muted">
          Starting Anon-RPC worker ({a.networkId}) — verifying hash-pinned code and connecting. Reads begin once it is ready.
        </div>
      )}
      {a.mode === "direct" && (
        <div className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-2 text-sm text-accent">
          Standard RPC: reads go directly from your browser to the RPC endpoint, which sees your IP address.
        </div>
      )}
      {wrongChain && (
        <div className="flex items-center gap-3 rounded-xl border border-line bg-card px-4 py-2 text-sm">
          Wallet is on a different network. PrivateSwap uses {CHAIN.name}.
          <button onClick={switchToAppChain} className="ml-auto rounded-lg bg-accent px-3 py-1 font-medium text-accent-fg">Switch</button>
        </div>
      )}
    </div>
  );
}
