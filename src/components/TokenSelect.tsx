"use client";
import { useState } from "react";
import { DEFAULT_TOKENS, lookupToken, type Token } from "@/lib/tokens";
import { useTokenBalance, useWallet } from "@/lib/hooks";
import { formatUnits } from "viem";

const custom: Token[] = []; // tokens the user added this session (validated onchain)

function Row({ t, onPick }: { t: Token; onPick: (t: Token) => void }) {
  const w = useWallet();
  const bal = useTokenBalance(t, w.address);
  return (
    <button onClick={() => onPick(t)} className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-card2">
      <span>
        <span className="font-medium">{t.symbol}</span>
        <span className="ml-2 text-xs text-muted">{t.name}</span>
        {!t.native && <div className="mono text-[10px] text-muted">{t.address}</div>}
      </span>
      <span className="mono text-xs text-muted">{bal.data !== undefined ? Number(formatUnits(bal.data, t.decimals)).toLocaleString(undefined, { maximumFractionDigits: 6 }) : ""}</span>
    </button>
  );
}

export default function TokenSelect({ value, onChange, exclude }: { value: Token | null; onChange: (t: Token) => void; exclude?: Token | null }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const list = [...DEFAULT_TOKENS, ...custom].filter(
    (t) => t.address !== exclude?.address && (!q || t.symbol.toLowerCase().includes(q.toLowerCase()) || t.address.toLowerCase() === q.toLowerCase()),
  );
  const pick = (t: Token) => { onChange(t); setOpen(false); setQ(""); setErr(null); };

  async function add() {
    setBusy(true); setErr(null);
    try {
      const t = await lookupToken(q.trim());
      if (!DEFAULT_TOKENS.concat(custom).some((x) => x.address === t.address)) custom.push(t);
      pick(t);
    } catch (e) { setErr(e instanceof Error ? e.message : "Lookup failed"); }
    finally { setBusy(false); }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex shrink-0 items-center gap-2 rounded-full border border-line bg-card2 px-3 py-1.5 text-sm font-semibold hover:border-accent">
        {value ? value.symbol : "Select token"} <span className="text-muted">▾</span>
      </button>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-sm rounded-2xl border border-line bg-card p-4" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between"><span className="font-semibold">Select a token</span><button onClick={() => setOpen(false)} className="text-muted">✕</button></div>
            <input
              autoFocus value={q} onChange={(e) => { setQ(e.target.value); setErr(null); }}
              placeholder="Search symbol or paste token address"
              className="mono w-full rounded-xl border border-line bg-card2 px-3 py-2 text-sm outline-none focus:border-accent"
            />
            <div className="mt-2 max-h-72 overflow-y-auto">
              {list.map((t) => <Row key={t.address} t={t} onPick={pick} />)}
              {list.length === 0 && /^0x[0-9a-fA-F]{40}$/.test(q.trim()) && (
                <button onClick={add} disabled={busy} className="w-full rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-accent-fg disabled:opacity-60">
                  {busy ? "Reading token from chain…" : "Look up & validate token onchain"}
                </button>
              )}
              {list.length === 0 && !/^0x[0-9a-fA-F]{40}$/.test(q.trim()) && <p className="p-3 text-sm text-muted">No match. Paste a token contract address to look it up.</p>}
            </div>
            {err && <p className="mt-2 text-xs text-bad">{err}</p>}
            <p className="mt-2 text-[11px] text-muted">Symbol, name and decimals are read from the contract through the active read transport; non-ERC-20 addresses are rejected.</p>
          </div>
        </div>
      )}
    </>
  );
}
