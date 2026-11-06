"use client";
import { useEffect, useState } from "react";
import { formatUnits, parseUnits, type Address } from "viem";
import { useQueryClient } from "@tanstack/react-query";
import { CHAIN } from "@/lib/ethereum/chains";
import { ETH, WETH, wrapped, type Token } from "@/lib/tokens";
import { erc20Abi, routerAbi } from "@/lib/uniswap/abis";
import { getAmountOut, minReceived, priceImpactBps } from "@/lib/uniswap/pricing";
import { useAllowance, usePair, useQuote, useReadsReady, useTokenBalance, useWallet, useAnon } from "@/lib/hooks";
import { connect, getWalletClient, switchToAppChain } from "@/lib/ethereum/wallet";
import { runTx, type TxState } from "@/lib/ethereum/tx";
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
  const [slip, setSlip] = useState(50); // bps
  const [tx, setTx] = useState<TxState>({ phase: "idle" });

  const amountIn = from ? parse(amount, from.decimals) : 0n;
  const balIn = useTokenBalance(from, w.address);
  const balOut = useTokenBalance(to, w.address);
  const quote = useQuote(from, to, amountIn);
  const direct = quote.data?.path.length === 2;
  const pair = usePair(direct ? from : null, direct ? to : null);
  const allowance = useAllowance(from, w.address, CHAIN.router);

  useEffect(() => { setTx((t) => (t.phase === "pending" || t.phase === "wallet" ? t : { phase: "idle" })); }, [from, to, amount]);

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
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 20 * 60);
    const label = `Swap ${from.symbol} → ${to.symbol}`;
    const send = () =>
      from.native
        ? c.writeContract({ address: CHAIN.router, abi: routerAbi, functionName: "swapExactETHForTokens", args: [minOut, path, w.address!, deadline], value: amountIn })
        : to.native
          ? c.writeContract({ address: CHAIN.router, abi: routerAbi, functionName: "swapExactTokensForETH", args: [amountIn, minOut, path, w.address!, deadline] })
          : c.writeContract({ address: CHAIN.router, abi: routerAbi, functionName: "swapExactTokensForTokens", args: [amountIn, minOut, path, w.address!, deadline] });
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

  const flip = () => { setFrom(to); setTo(from); setAmount(""); };

  return (
    <div className="w-full max-w-md rounded-3xl border border-line bg-card p-3 shadow-2xl shadow-black/40">
      <div className="flex items-center justify-between px-2 pb-2 pt-1">
        <h2 className="font-semibold">Swap</h2>
        <label className="flex items-center gap-1 text-xs text-muted">Slippage
          <select value={slip} onChange={(e) => setSlip(Number(e.target.value))} className="rounded-md border border-line bg-card2 px-1.5 py-1 text-fg">
            {[10, 50, 100, 300].map((b) => <option key={b} value={b}>{b / 100}%</option>)}
          </select>
        </label>
      </div>

      <div className="rounded-2xl bg-card2 p-4">
        <div className="mb-1 text-xs text-muted">You pay</div>
        <div className="flex items-center gap-2">
          <input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))} inputMode="decimal" placeholder="0.0" className="mono w-full min-w-0 bg-transparent text-3xl outline-none" />
          <TokenSelect value={from} onChange={setFrom} exclude={to} />
        </div>
        <div className="mt-1 flex justify-between text-xs text-muted">
          <span>Balance: {fmt(balIn.data, from?.decimals ?? 18)}</span>
          {balIn.data !== undefined && from && <button className="hover:text-accent" onClick={() => setAmount(formatUnits(from.native && balIn.data! > 10n ** 16n ? balIn.data! - 10n ** 16n : balIn.data!, from.decimals))}>Max</button>}
        </div>
      </div>

      <div className="relative z-10 -my-3 flex justify-center">
        <button onClick={flip} className="grid h-9 w-9 place-items-center rounded-xl border-4 border-card bg-card2 text-muted hover:text-accent" aria-label="Flip tokens">↓</button>
      </div>

      <div className="rounded-2xl bg-card2 p-4">
        <div className="mb-1 text-xs text-muted">You receive</div>
        <div className="flex items-center gap-2">
          <div className="mono w-full min-w-0 truncate text-3xl text-fg/90">{quote.isFetching && amountIn > 0n ? "…" : out > 0n && to ? fmt(out, to.decimals, 8) : "0.0"}</div>
          <TokenSelect value={to} onChange={setTo} exclude={from} />
        </div>
        <div className="mt-1 text-xs text-muted">Balance: {fmt(balOut.data, to?.decimals ?? 18)}</div>
      </div>

      {out > 0n && from && to && (
        <dl className="mt-3 space-y-1 px-2 text-xs text-muted">
          <div className="flex justify-between"><dt>Rate</dt><dd className="mono">1 {from.symbol} ≈ {fmt((out * 10n ** BigInt(from.decimals)) / amountIn, to.decimals, 6)} {to.symbol}</dd></div>
          <div className="flex justify-between"><dt>Route</dt><dd className="mono">{quote.data!.path.length === 2 ? "Direct pair" : "via WETH"}</dd></div>
          <div className="flex justify-between"><dt>Price impact</dt><dd className={`mono ${impact !== null && impact > 300 ? "text-bad" : ""}`}>{impact === null ? "n/a (multi-hop)" : `${(impact / 100).toFixed(2)}%`}</dd></div>
          <div className="flex justify-between"><dt>Minimum received</dt><dd className="mono">{fmt(minOut, to.decimals, 8)} {to.symbol}</dd></div>
          <div className="flex justify-between"><dt>LP fee (0.3%)</dt><dd className="mono">{fmt(fee, from.decimals, 8)} {from.symbol}</dd></div>
        </dl>
      )}

      {quote.isError && amountIn > 0n && <p className="mt-2 px-2 text-xs text-bad">{(quote.error as Error).message}</p>}

      <button
        disabled={!enabled}
        onClick={() => "fn" in btn && btn.fn?.()}
        className="mt-3 w-full rounded-2xl bg-accent py-3.5 text-base font-semibold text-accent-fg transition hover:brightness-110 disabled:bg-card2 disabled:text-muted"
      >
        {btn.text}
      </button>
      <TxStatus tx={tx} />
      <p className="mt-3 px-2 text-[11px] leading-snug text-muted">
        Quotes, balances and allowances are read via <b className="text-fg">{anon.mode === "anon" ? "Anon-RPC" : "Standard RPC (direct)"}</b>. Approve &amp; swap are signed and broadcast by your wallet — not anonymised.
      </p>
    </div>
  );
}
