import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "Privora — Private Uniswap V2 swaps, powered by Anon-RPC",
  description: "Swap privately. Read anonymously. Uniswap V2 with chain reads routed through Anon-RPC.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
