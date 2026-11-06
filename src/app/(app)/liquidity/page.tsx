import LiquidityPanel from "@/components/liquidity/LiquidityPanel";

export default function Liquidity() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Liquidity</h1>
        <p className="mt-1 text-sm text-muted">Provide or withdraw liquidity on Uniswap V2 pools.</p>
      </div>
      <LiquidityPanel />
    </div>
  );
}
