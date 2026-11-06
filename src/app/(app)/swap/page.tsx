import Brackets, { Label } from "@/components/Brackets";
import SwapCard from "@/components/swap/SwapCard";
import PrivacyStrip from "@/components/PrivacyStrip";

export default function SwapPage() {
  return (
    <div className="flex flex-col items-center gap-8">
      <div className="fade-up text-center">
        <Label>SWAP</Label>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Swap</h1>
        <p className="mt-1 text-sm text-muted">Uniswap V2. Reads go through Anon-RPC; your wallet signs the transaction.</p>
      </div>
      <div style={{ ["--d" as string]: "100ms" }} className="fade-up flex w-full justify-center"><SwapCard /></div>
      <div style={{ ["--d" as string]: "220ms" }} className="fade-up flex w-full justify-center"><PrivacyStrip /></div>
    </div>
  );
}
