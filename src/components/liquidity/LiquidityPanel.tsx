"use client";
import { useCallback, useState } from "react";
import { formatUnits } from "viem";
import { useQueryClient } from "@tanstack/react-query";
import { CHAIN } from "@/lib/ethereum/chains";
import { ETH, wrapped, type Token } from "@/lib/tokens";
import { erc20Abi, routerAbi } from "@/lib/uniswap/abis";
import { minReceived, quote as proportional } from "@/lib/uniswap/pricing";
import { useAllowance, useLpBalance, usePair, useReadsReady, useTokenBalance, useUrlTokens, useWallet } from "@/lib/hooks";
import { connect, getWalletClient, switchToAppChain } from "@/lib/ethereum/wallet";
import { bufferedGas, firstValid, runTx, type TxState } from "@/lib/ethereum/tx";
import { readClient } from "@/lib/ethereum/read-client";
import { getSettings, useSettings } from "@/lib/settings";
import TokenSelect from "../TokenSelect";
import TxStatus from "../TxStatus";
import { parse } from "../swap/SwapCard";

const fmt = (v: bigint | undefined, d: number, max = 6) => (v === undefined ? "–" : Number(formatUnits(v, d)).toLocaleString(undefined, { maximumFractionDigits: max }));

export default function LiquidityPanel() {
  const deadline = () => BigInt(Math.floor(Date.now() / 1000) + getSettings().deadlineMin * 60);
  const w = useWallet();
  const qc = useQueryClient();
  const { ready } = useReadsReady();
  const [A, setA] = useState<Token | null>(ETH);
  const [B, setB] = useState<Token | null>(null);
  const [amtA, setAmtA] = useState("");
  const [amtB, setAmtB] = useState("");
  const { slippageBps: slip, deadlineMin } = useSettings();
  const [pct, setPct] = useState(50);
  const [tx, setTx] = useState<TxState>({ phase: "idle" });

  useUrlTokens(useCallback((slot, t) => (slot === 0 ? setA(t) : setB(t)), []));

  const pair = usePair(A, B);
  const balA = useTokenBalance(A, w.address);
  const balB = useTokenBalance(B, w.address);
  const allowA = useAllowance(A, w.address, CHAIN.router);
  const allowB = useAllowance(B, w.address, CHAIN.router);
  const lpBal = useLpBalance(pair.data?.pair, w.address);
  const lpToken: Token | null = pair.data ? { address: pair.data.pair, symbol: "UNI-V2", name: "Uniswap V2 LP", decimals: 18 } : null;
  const lpAllow = useAllowance(lpToken, w.address, CHAIN.router);

  const pool = pair.data;
  const inA = A ? parse(amtA, A.decimals) : 0n;
  const inB = B ? parse(amtB, B.decimals) : 0n;
  const busy = tx.phase === "wallet" || tx.phase === "pending";
  const refetch = () => qc.invalidateQueries();

  const editA = (v: string) => {
    v = v.replace(/[^0-9.]/g, ""); setAmtA(v);
    if (pool && A && B) { const x = proportional(parse(v, A.decimals), pool.reserveA, pool.reserveB); setAmtB(x ? formatUnits(x, B.decimals) : ""); }
  };
  const editB = (v: string) => {
    v = v.replace(/[^0-9.]/g, ""); setAmtB(v);
    if (pool && A && B) { const x = proportional(parse(v, B.decimals), pool.reserveB, pool.reserveA); setAmtA(x ? formatUnits(x, A.decimals) : ""); }
  };

  const needA = !!A && !A.native && inA > 0n && (allowA.data ?? 0n) < inA;
  const needB = !!B && !B.native && inB > 0n && (allowB.data ?? 0n) < inB;
  const insufficient = (balA.data !== undefined && inA > balA.data) || (balB.data !== undefined && inB > balB.data);
  const wrongChain = w.chainId !== null && w.chainId !== CHAIN.id;

  async function approve(t: Token, amount: bigint) {
    const c = getWalletClient();
    if (await runTx(`Approve ${t.symbol}`, () => c.writeContract({ address: t.address, abi: erc20Abi, functionName: "approve", args: [CHAIN.router, amount] }), setTx)) refetch();
  }

  async function add() {
    if (!A || !B || !w.address) return;
    const c = getWalletClient();
    const me = w.address;
    const send = async () => {
      if (A.native || B.native) {
        const tok = A.native ? B : A; const tAmt = A.native ? inB : inA; const eAmt = A.native ? inA : inB;
        const req = { address: CHAIN.router, abi: routerAbi, functionName: "addLiquidityETH", args: [tok.address, tAmt, minReceived(tAmt, slip), minReceived(eAmt, slip), me, deadline()], value: eAmt } as never;
        const gas = await bufferedGas(() => readClient.estimateContractGas({ ...(req as object), account: me } as never));
        return c.writeContract({ ...(req as object), ...(gas ? { gas } : {}) } as never);
      }
      return c.writeContract({ address: CHAIN.router, abi: routerAbi, functionName: "addLiquidity", args: [A.address, B.address, inA, inB, minReceived(inA, slip), minReceived(inB, slip), me, deadline()] });
    };
    if (await runTx(`Add ${A.symbol}/${B.symbol} liquidity`, send, setTx)) { setAmtA(""); setAmtB(""); refetch(); }
  }

  const lp = lpBal.data ?? 0n;
  const rmLiq = (lp * BigInt(pct)) / 100n;
  const rmA = pool && pool.totalSupply > 0n ? (pool.reserveA * rmLiq) / pool.totalSupply : 0n;
  const rmB = pool && pool.totalSupply > 0n ? (pool.reserveB * rmLiq) / pool.totalSupply : 0n;
  const needLpApproval = rmLiq > 0n && (lpAllow.data ?? 0n) < rmLiq;

  async function remove() {
    if (!A || !B || !pool || !w.address) return;
    const c = getWalletClient();
    const me = w.address;
    const send = async () => {
      if (A.native || B.native) {
        const tok = A.native ? B : A; const tA = A.native ? rmB : rmA; const eA = A.native ? rmA : rmB;
        const args = [tok.address, rmLiq, minReceived(tA, slip), minReceived(eA, slip), me, deadline()];
        const fn = await firstValid(["removeLiquidityETH", "removeLiquidityETHSupportingFeeOnTransferTokens"], (f) =>
          readClient.simulateContract({ address: CHAIN.router, abi: routerAbi, functionName: f, args, account: me } as never),
        ).catch((e) => { throw new Error(`Remove would fail: ${(e as { shortMessage?: string }).shortMessage ?? (e as Error).message}`); });
        const req = { address: CHAIN.router, abi: routerAbi, functionName: fn, args } as never;
        const gas = await bufferedGas(() => readClient.estimateContractGas({ ...(req as object), account: me } as never));
        return c.writeContract({ ...(req as object), ...(gas ? { gas } : {}) } as never);
      }
      return c.writeContract({ address: CHAIN.router, abi: routerAbi, functionName: "removeLiquidity", args: [wrapped(A), wrapped(B), rmLiq, minReceived(rmA, slip), minReceived(rmB, slip), me, deadline()] });
    };
    if (await runTx(`Remove ${A.symbol}/${B.symbol} liquidity`, send, setTx)) refetch();
  }
  async function approveLp() {
    if (!lpToken) return;
    const c = getWalletClient();
    if (await runTx("Approve LP token", () => c.writeContract({ address: lpToken.address, abi: erc20Abi, functionName: "approve", args: [CHAIN.router, rmLiq] }), setTx)) refetch();
  }

  const addBtn = (() => {
    if (!w.address) return { text: "Connect wallet", fn: connect, on: true };
    if (wrongChain) return { text: `Switch to ${CHAIN.name}`, fn: switchToAppChain, on: true };
    if (!A || !B) return { text: "Select both tokens", on: false };
    if (wrapped(A) === wrapped(B)) return { text: "Select different tokens", on: false };
    if (!ready) return { text: "Reads unavailable", on: false };
    if (!inA || !inB) return { text: "Enter amounts", on: false };
    if (insufficient) return { text: "Insufficient balance", on: false };
    if (needA) return { text: `Approve ${A.symbol}`, fn: () => approve(A, inA), on: !busy };
    if (needB) return { text: `Approve ${B.symbol}`, fn: () => approve(B, inB), on: !busy };
    return { text: pool ? "Add liquidity" : "Create pool & add liquidity", fn: add, on: !busy };
  })();

  const share = pool && pool.totalSupply > 0n ? Number((lp * 1_000_000n) / pool.totalSupply) / 10_000 : 0;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-3xl border border-line bg-card p-3">
        <h2 className="px-2 pb-2 pt-1 font-semibold">Add liquidity</h2>
        {([[A, setA, amtA, editA, balA, B], [B, setB, amtB, editB, balB, A]] as const).map(([tok, setTok, amt, edit, bal, other], i) => (
          <div key={i} className="mb-2 rounded-2xl border border-line bg-card2 p-4">
            <div className="flex items-center gap-2">
              <input value={amt} onChange={(e) => edit(e.target.value)} placeholder="0.0" inputMode="decimal" className="mono w-full min-w-0 bg-transparent text-2xl outline-none" />
              <TokenSelect value={tok} onChange={setTok} exclude={other} />
            </div>
            <div className="mt-1 text-xs text-muted">Balance: {fmt(bal.data, tok?.decimals ?? 18)}</div>
          </div>
        ))}
        {A && B && wrapped(A) !== wrapped(B) && (
          <div className="px-2 text-xs text-muted">
            {pair.isFetching ? "Reading pool…" : pool ? (
              <>Pool <span className="mono">{pool.pair.slice(0, 10)}…</span> · reserves {fmt(pool.reserveA, A.decimals, 4)} {A.symbol} / {fmt(pool.reserveB, B.decimals, 4)} {B.symbol}</>
            ) : pair.isSuccess ? <span className="text-accent">No pool yet — the first provider sets the initial price.</span> : null}
          </div>
        )}
        <button disabled={!addBtn.on} onClick={() => addBtn.fn?.()} className="mt-3 w-full rounded-2xl bg-accent py-3.5 font-semibold text-accent-fg hover:brightness-110 disabled:bg-card2 disabled:text-muted">{addBtn.text}</button>
      </div>

      <div className="rounded-3xl border border-line bg-card p-3">
        <h2 className="px-2 pb-2 pt-1 font-semibold">Your position</h2>
        {!w.address ? <p className="p-3 text-sm text-muted">Connect a wallet to see your LP position.</p>
          : !pool ? <p className="p-3 text-sm text-muted">Select two tokens with an existing pool.</p>
          : lp === 0n ? <p className="p-3 text-sm text-muted">You hold no liquidity in this pool.</p>
          : (
            <div className="space-y-3 p-2 text-sm">
              <dl className="grid grid-cols-2 gap-1 text-xs text-muted">
                <dt>LP tokens</dt><dd className="mono text-right text-fg">{fmt(lp, 18, 8)}</dd>
                <dt>Pool share</dt><dd className="mono text-right text-fg">{share.toFixed(4)}%</dd>
                <dt>Pooled {A!.symbol}</dt><dd className="mono text-right text-fg">{fmt((pool.reserveA * lp) / pool.totalSupply, A!.decimals, 6)}</dd>
                <dt>Pooled {B!.symbol}</dt><dd className="mono text-right text-fg">{fmt((pool.reserveB * lp) / pool.totalSupply, B!.decimals, 6)}</dd>
              </dl>
              <div className="flex gap-2">{[25, 50, 75, 100].map((p) => <button key={p} onClick={() => setPct(p)} className={`flex-1 rounded-lg border py-1.5 text-xs ${pct === p ? "border-accent text-accent" : "border-line text-muted"}`}>{p}%</button>)}</div>
              <div className="rounded-xl bg-card2 p-3 text-xs text-muted">You receive ≈ <span className="mono text-fg">{fmt(rmA, A!.decimals, 6)} {A!.symbol}</span> + <span className="mono text-fg">{fmt(rmB, B!.decimals, 6)} {B!.symbol}</span></div>
              <button disabled={busy || wrongChain} onClick={needLpApproval ? approveLp : remove} className="w-full rounded-2xl border border-accent py-3 font-semibold text-accent hover:bg-accent/10 disabled:opacity-50">
                {needLpApproval ? "Approve LP token" : "Remove liquidity"}
              </button>
            </div>
          )}
      </div>
      <div className="lg:col-span-2"><TxStatus tx={tx} />
        <p className="mt-3 text-[11px] text-muted">Balances, reserves, allowances and LP positions are read via the active privacy transport. Approvals, adds and removals are signed and sent by your wallet (not anonymised). Approvals are for the exact amount.</p>
      </div>
    </div>
  );
}
