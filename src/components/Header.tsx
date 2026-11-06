"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAnon, useWallet } from "@/lib/hooks";
import { setReadMode } from "@/lib/anon-rpc/manager";
import { connect, disconnect } from "@/lib/ethereum/wallet";
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
        <div className="ml-auto flex items-center gap-3">
          {w.address ? (
            <button onClick={disconnect} className="mono flex items-center gap-2 rounded-full border border-line bg-card px-4 py-2.5 text-sm transition hover:bg-card2" title="Disconnect">
              <span className="h-2 w-2 rounded-full bg-ok" />
              {short(w.address)}
            </button>
          ) : (
            <button onClick={connect} className="flex items-center gap-2 rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-accent-fg shadow-lg shadow-accent/25 transition hover:brightness-110 active:scale-[.98]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12V8a2 2 0 0 0-2-2H5a2 2 0 0 1 0-4h13M3 5v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4M16 14h5v-4h-5a2 2 0 0 0 0 4z" /></svg>
              Connect wallet
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
