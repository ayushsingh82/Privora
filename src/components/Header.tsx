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
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <Logo />
          Privora
        </Link>
        <nav className="order-last flex w-full gap-1 overflow-x-auto text-sm md:order-none md:w-auto">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={`whitespace-nowrap rounded-lg px-3 py-1.5 ${path === n.href ? "bg-card2 text-fg" : "text-muted hover:text-fg"}`}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <ModeToggle />
          {w.address ? (
            <button onClick={disconnect} className="mono rounded-full border border-line bg-card px-3 py-1.5 text-xs hover:border-accent" title="Disconnect">
              {short(w.address)}
            </button>
          ) : (
            <button onClick={connect} className="rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-accent-fg hover:brightness-110">
              Connect wallet
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
