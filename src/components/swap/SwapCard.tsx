"use client";
import Brackets from "@/components/Brackets";
import { useCallback, useState } from "react";
import { friendly } from "@/lib/errors";
import SlippageButton from "./SlippageButton";
import { formatUnits, parseUnits, type Address } from "viem";
import { useQueryClient } from "@tanstack/react-query";
import { CHAIN } from "@/lib/ethereum/chains";
import { ETH, WETH, wrapped, type Token } from "@/lib/tokens";
import { erc20Abi, routerAbi } from "@/lib/uniswap/abis";
import { getAmountOut, minReceived, priceImpactBps } from "@/lib/uniswap/pricing";
import { useAllowance, usePair, useQuote, useReadsReady, useTokenBalance, useUrlTokens, useWallet, useAnon } from "@/lib/hooks";
import { connect, getWalletClient, switchToAppChain } from "@/lib/ethereum/wallet";
import { bufferedGas, firstValid, runTx, type TxState } from "@/lib/ethereum/tx";
import { readClient } from "@/lib/ethereum/read-client";
import { setSettings, useSettings } from "@/lib/settings";
import TokenSelect from "../TokenSelect";
import TxStatus from "../TxStatus";

const fmt = (v: bigint | undefined, d: number, max = 6) => (v === undefined ? "–" : Number(formatUnits(v, d)).toLocaleString(undefined, { maximumFractionDigits: max }));
export function parse(s: string, d: number): bigint {
  try { return s && Number(s) > 0 ? parseUnits(s, d) : 0n; } catch { return 0n; }
}

export default function SwapCard() {
  const w = useWallet();
  const qc = useQueryClient();
  const anon = useAnon();
  const { ready } = useReadsReady();
  const [from, setFrom] = useState<Token | null>(ETH);
  const [to, setTo] = useState<Token | null>(WETH);
  const [amount, setAmount] = useState("");
  const { slippageBps: slip, deadlineMin } = useSettings();
  const [tx, setTx] = useState<TxState>({ phase: "idle" });

  useUrlTokens(useCallback((slot, t) => (slot === 0 ? setFrom(t) : setTo(t)), []));

  const amountIn = from ? parse(amount, from.decimals) : 0n;
  const balIn = useTokenBalance(from, w.address);
  const balOut = useTokenBalance(to, w.address);
  const quote = useQuote(from, to, amountIn);
  const direct = quote.data?.path.length === 2;
  const pair = usePair(direct ? from : null, direct ? to : null);
  const allowance = useAllowance(from, w.address, CHAIN.router);

  // Clear a finished/failed status when the USER changes the form (not when we reset the amount after a success).
  const clearTx = () => setTx((t) => (t.phase === "pending" || t.phase === "wallet" ? t : { phase: "idle" }));

  const out = quote.data?.out ?? 0n;
  const impact = pair.data && direct ? priceImpactBps(amountIn, getAmountOut(amountIn, pair.data.reserveA, pair.data.reserveB), pair.data.reserveA, pair.data.reserveB) : null;
  const minOut = minReceived(out, slip);
  const fee = (amountIn * 3n) / 1000n;
  const needsApproval = !!from && !from.native && amountIn > 0n && (allowance.data ?? 0n) < amountIn;
  const insufficient = balIn.data !== undefined && amountIn > balIn.data;
  const wrongChain = w.chainId !== null && w.chainId !== CHAIN.id;
  const busy = tx.phase === "wallet" || tx.phase === "pending";

  const refetch = () => { qc.invalidateQueries(); };

  async function approve() {
    if (!from || !w.address) return;
    const c = getWalletClient();
    // Exact-amount approval by default (no unlimited allowance).
    if (await runTx(`Approve ${from.symbol}`, () => c.writeContract({ address: from.address, abi: erc20Abi, functionName: "approve", args: [CHAIN.router, amountIn] }), setTx)) refetch();
  }

  async function swap() {
    if (!from || !to || !w.address || !quote.data) return;
    const c = getWalletClient();
    const path = quote.data.path as Address[];
    const deadline = BigInt(Math.floor(Date.now() / 1000) + deadlineMin * 60);
    const label = `Swap ${from.symbol} for ${to.symbol}`;
    const me = w.address;
    type Call = { fn: string; args: unknown[]; value?: bigint };
    const std: Call = from.native
      ? { fn: "swapExactETHForTokens", args: [minOut, path, me, deadline], value: amountIn }
      : to.native
        ? { fn: "swapExactTokensForETH", args: [amountIn, minOut, path, me, deadline] }
        : { fn: "swapExactTokensForTokens", args: [amountIn, minOut, path, me, deadline] };
    // Taxed / fee-on-transfer tokens make the standard functions revert ("UniswapV2: K"): use the router's
    // SupportingFeeOnTransferTokens variant when (and only when) the standard call fails simulation.
    const fee: Call = { ...std, fn: `${std.fn}SupportingFeeOnTransferTokens` };
    const send = async () => {
      const call = await firstValid([std, fee], (x) =>
        readClient.simulateContract({ address: CHAIN.router, abi: routerAbi, functionName: x.fn, args: x.args, account: me, value: x.value } as never),
      ).catch((e) => { throw new Error(`Swap would fail: ${(e as { shortMessage?: string }).shortMessage ?? (e as Error).message}. If this token charges a transfer fee, raise slippage above that fee.`); });
      const req = { address: CHAIN.router, abi: routerAbi, functionName: call.fn, args: call.args, value: call.value } as never;
      const gas = await bufferedGas(() => readClient.estimateContractGas({ ...(req as object), account: me } as never));
      return c.writeContract({ ...(req as object), ...(gas ? { gas } : {}) } as never);
    };
    if (await runTx(label, send, setTx)) { setAmount(""); refetch(); }
  }

  const btn = (() => {
    if (!w.address) return { text: "Connect wallet", fn: connect };
    if (wrongChain) return { text: `Switch to ${CHAIN.name}`, fn: switchToAppChain };
    if (!from || !to) return { text: "Select a token" };
    if (wrapped(from) === wrapped(to)) return { text: "Select different tokens" };
    if (!amountIn) return { text: "Enter an amount" };
    if (!ready) return { text: anon.mode === "anon" ? "Anon-RPC not ready" : "Reads unavailable" };
    if (quote.isError) return { text: "No route" };
    if (!quote.data) return { text: "Fetching quote…" };
    if (insufficient) return { text: `Insufficient ${from.symbol} balance` };
    if (needsApproval) return { text: busy ? "Approving…" : `Approve ${from.symbol}`, fn: approve, enabled: !busy };
    return { text: busy ? "Swapping…" : "Swap", fn: swap, enabled: !busy };
  })();
  const enabled = "fn" in btn && (btn.fn === connect || btn.fn === switchToAppChain || ("enabled" in btn && btn.enabled));

  const flip = () => { clearTx(); setFrom(to); setTo(from); setAmount(""); };

  return (
    <div className="relative w-full max-w-md bg-card p-4">
      <Brackets corners={["tl", "br"]} size={26} />
      <div className="flex items-center justify-between px-2 pb-2 pt-1">
        <h2 className="text-lg font-semibold">Swap</h2>
        <SlippageButton />
      </div>

      <div className="rounded-none border border-line bg-card2 p-4">
        <div className="mb-2 text-sm text-muted">You pay</div>
        <div className="flex items-center gap-2">
          <input value={amount} onChange={(e) => { clearTx(); setAmount(e.target.value.replace(/[^0-9.]/g, "")); }} inputMode="decimal" placeholder="0.0" className="mono w-full min-w-0 bg-transparent text-4xl font-medium outline-none placeholder:text-muted/40" />
          <TokenSelect value={from} onChange={(t) => { clearTx(); setFrom(t); }} exclude={to} />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-muted">
          <span>Balance: {fmt(balIn.data, from?.decimals ?? 18)}</span>
          {balIn.data !== undefined && from && (
            <span className="flex gap-1.5">
              <button className="rounded-md bg-accent/15 px-2 py-0.5 font-semibold text-accent hover:bg-accent/25" onClick={() => setAmount(formatUnits(balIn.data! / 2n, from.decimals))}>Half</button>
              <button className="rounded-md bg-accent/15 px-2 py-0.5 font-semibold text-accent hover:bg-accent/25" onClick={() => setAmount(formatUnits(from.native && balIn.data! > 10n ** 16n ? balIn.data! - 10n ** 16n : balIn.data!, from.decimals))}>Max</button>
            </span>
          )}
        </div>
      </div>

      <div className="relative z-10 -my-3 flex justify-center">
        <button onClick={flip} className="grid h-9 w-9 place-items-center rounded-none border-4 border-card bg-card2 text-muted transition hover:bg-line hover:text-fg" aria-label="Flip tokens"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v10M4 9l4 4 4-4" /></svg></button>
      </div>

      <div className="rounded-none border border-line bg-card2 p-4">
        <div className="mb-2 text-sm text-muted">You receive</div>
        <div className="flex items-center gap-2">
          {quote.isFetching && amountIn > 0n
            ? <div className="skeleton h-10 w-40" aria-label="Fetching quote" />
            : <div className="mono w-full min-w-0 truncate text-4xl font-medium text-fg/90">{out > 0n && to ? fmt(out, to.decimals, 8) : "0.0"}</div>}
          <TokenSelect value={to} onChange={(t) => { clearTx(); setTo(t); }} exclude={from} />
        </div>
        <div className="mt-2 text-xs text-muted">Balance: {fmt(balOut.data, to?.decimals ?? 18)}</div>
      </div>

      {out > 0n && from && to && (
        <details open className="group mt-3 rounded-none border border-line px-4 py-3 text-xs text-muted">
          <summary className="flex cursor-pointer list-none items-center justify-between text-fg">
            <span className="mono">1 {from.symbol} ≈ {fmt((out * 10n ** BigInt(from.decimals)) / amountIn, to.decimals, 6)} {to.symbol}</span>
            <span className="flex items-center gap-2 text-muted">
              {impact !== null && <span className={`rounded-md px-1.5 py-0.5 ${impact > 300 ? "bg-bad/15 text-bad" : "bg-card2"}`}>Impact {(impact / 100).toFixed(2)}%</span>}
              <svg className="transition group-open:rotate-180" width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6l4 4 4-4" /></svg>
            </span>
          </summary>
          <dl className="mt-3 space-y-1.5 border-t border-line pt-3">
          <div className="flex justify-between"><dt>Quote source</dt><dd className="mono">Uniswap V2 router (onchain)</dd></div>
          <div className="flex justify-between"><dt>Route</dt><dd className="mono">{quote.data!.path.length === 2 ? "Direct pair" : "via WETH"}</dd></div>
          <div className="flex justify-between"><dt>Price impact</dt><dd className={`mono ${impact !== null && impact > 300 ? "text-bad" : ""}`}>{impact === null ? (quote.data!.path.length === 2 ? "calculating…" : "n/a (multi-hop)") : `${(impact / 100).toFixed(2)}%`}</dd></div>
          <div className="flex justify-between"><dt>Minimum received</dt><dd className="mono">{fmt(minOut, to.decimals, 8)} {to.symbol}</dd></div>
          <div className="flex justify-between"><dt>LP fee (0.3%)</dt><dd className="mono">{fmt(fee, from.decimals, 8)} {from.symbol}</dd></div>
          </dl>
        </details>
      )}

      {slip >= 500 && <p className="mt-2 px-2 text-xs text-accent">High slippage ({slip / 100}%): you may receive far less than quoted and the trade can be sandwiched. Needed only for tokens that charge a transfer fee.</p>}
      {quote.isError && amountIn > 0n && <p className="mt-2 px-2 text-xs text-bad">{friendly(quote.error)}</p>}

      <button
        disabled={!enabled}
        onClick={() => "fn" in btn && btn.fn?.()}
        className="mt-3 w-full rounded-none bg-accent py-4 text-base font-semibold text-accent-fg transition hover:brightness-110 disabled:bg-card2 disabled:text-muted"
      >
        {btn.text}
      </button>
      <TxStatus tx={tx} />
      <div className="mt-3 flex items-center gap-2 rounded-none bg-accent/10 px-3 py-2.5 text-xs">
        <span className={`h-2 w-2 shrink-0 rounded-full ${anon.mode !== "anon" ? "bg-muted" : anon.status === "ready" ? "bg-ok" : anon.status === "failed" ? "bg-bad" : "bg-accent"}`} />
        <span className="font-semibold text-accent">{anon.mode === "anon" ? "Anon-RPC" : "Standard RPC (direct)"}</span>
        <span className="text-muted">{anon.mode !== "anon" ? "reads are direct" : anon.status === "ready" ? "active, reads are anonymised" : anon.status === "failed" ? "unavailable" : "starting"}</span>
      </div>
    </div>
  );
}
