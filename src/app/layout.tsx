import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import Header from "@/components/Header";
import PrivacyBanner from "@/components/PrivacyBanner";

export const metadata: Metadata = {
  title: "PrivateSwap — Uniswap V2, powered by Anon-RPC",
  description: "Swap privately. Read anonymously. Uniswap V2 with chain reads routed through Anon-RPC.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <Providers>
          <Header />
          <PrivacyBanner />
          <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
          <footer className="mx-auto max-w-6xl px-4 pb-10 text-xs text-muted">
            Anon-RPC anonymizes chain <em>reads</em> only. Transactions are signed and sent by your wallet and are public onchain.
          </footer>
        </Providers>
      </body>
    </html>
  );
}
