"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAnon, useWallet } from "@/lib/hooks";
import { setReadMode } from "@/lib/anon-rpc/manager";
import { useState } from "react";
import { connect, disconnect, switchToAppChain } from "@/lib/ethereum/wallet";
import { CHAIN } from "@/lib/ethereum/chains";
import Logo from "./Logo";

const NAV = [
  { href: "/", label: "Swap" },
  { href: "/liquidity", label: "Liquidity" },
  { href: "/pools", label: "Pools" },
  { href: "/privacy", label: "Privacy Center" },
  { href: "/settings", label: "Settings" },
];

export const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

export function ModeToggle() {
  const a = useAnon();
  const unavailable = a.status !== "ready";
  const anonActive = a.mode === "anon";
  return (
    <div className="flex items-center gap-2">
      <div className="flex rounded-full border border-line bg-card p-0.5 text-xs font-medium">
        <button
          onClick={() => setReadMode("anon")}
          className={`rounded-full px-3 py-1.5 transition ${anonActive ? "bg-accent text-accent-fg" : "text-muted hover:text-fg"}`}
        >
          Anon-RPC
        </button>
        <button
          onClick={() => setReadMode("direct")}
          className={`rounded-full px-3 py-1.5 transition ${!anonActive ? "bg-card2 text-fg" : "text-muted hover:text-fg"}`}
        >
          Standard
        </button>
      </div>
      <span className="hidden items-center gap-1.5 text-xs sm:flex" title="Transport used for chain reads">
        <span className={`h-2 w-2 rounded-full ${anonActive ? (unavailable ? "bg-bad" : "bg-ok") : "bg-muted"}`} />
        <span className="text-muted">
          {anonActive ? (a.status === "ready" ? "Anon-RPC active" : a.status === "starting" ? "Anon-RPC starting…" : "Anon-RPC unavailable") : "Standard RPC (direct)"}
        </span>
      </span>
    </div>
  );
}

function WalletButton() {
  const w = useWallet();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  if (!w.address) {
    return (
      <button onClick={connect} className="flex items-center gap-2.5 rounded-full bg-accent py-3 pl-5 pr-6 text-sm font-semibold text-accent-fg shadow-lg shadow-accent/30 transition hover:brightness-110 active:scale-[.98]">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12V8a2 2 0 0 0-2-2H5a2 2 0 0 1 0-4h13M3 5v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4M16 14h5v-4h-5a2 2 0 0 0 0 4z" /></svg>
        Connect wallet
      </button>
    );
  }
  const wrong = w.chainId !== null && w.chainId !== CHAIN.id;
  return (
    <div className="relative flex items-center gap-2">
      {wrong ? (
        <button onClick={switchToAppChain} className="rounded-full bg-bad/15 px-3.5 py-2.5 text-sm font-semibold text-bad hover:bg-bad/25">Switch to {CHAIN.name}</button>
      ) : (
        <span className="hidden items-center gap-2 rounded-full bg-card px-3.5 py-2.5 text-sm font-medium sm:flex"><span className="h-2 w-2 rounded-full bg-ok" />{CHAIN.name}</span>
      )}
      <button onClick={() => setOpen((o) => !o)} className="mono flex items-center gap-2 rounded-full bg-card py-2.5 pl-4 pr-3.5 text-sm font-medium transition hover:bg-card2" aria-expanded={open}>
        {short(w.address)}
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6l4 4 4-4" /></svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-60 rounded-2xl border border-line bg-card p-2 shadow-2xl shadow-black/60">
            <div className="px-3 py-2">
              <div className="text-xs text-muted">Connected wallet</div>
              <div className="mono mt-0.5 break-all text-xs">{w.address}</div>
            </div>
            <button onClick={() => { navigator.clipboard?.writeText(w.address!).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }).catch(() => {}); }} className="w-full rounded-xl px-3 py-2.5 text-left text-sm hover:bg-card2">
              {copied ? "Copied" : "Copy address"}
            </button>
            <button onClick={() => { setOpen(false); disconnect(); }} className="w-full rounded-xl px-3 py-2.5 text-left text-sm text-bad hover:bg-bad/10">Disconnect</button>
          </div>
        </>
      )}
    </div>
  );
}

export default function Header() {
  const path = usePathname();
  const w = useWallet();
  return (
    <header className="sticky top-0 z-30 bg-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-5">
        <Link href="/" className="flex items-center gap-2.5 text-lg font-semibold tracking-tight">
          <Logo size={36} />
          Privora
        </Link>
        <nav className="order-last flex w-full gap-1 overflow-x-auto text-sm md:order-none md:w-auto">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={`whitespace-nowrap rounded-lg px-3.5 py-2 ${path === n.href ? "bg-accent/15 font-semibold text-accent" : "text-muted hover:bg-card2 hover:text-fg"}`}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto"><WalletButton /></div>
      </div>
    </header>
  );
}
