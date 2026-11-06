import Brackets, { Label } from "@/components/Brackets";
import LiquidityPanel from "@/components/liquidity/LiquidityPanel";

export default function Liquidity() {
  return (
    <div className="space-y-6">
      <div>
        <Label>LIQUIDITY</Label>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Liquidity</h1>
        <p className="mt-1 text-sm text-muted">Provide or withdraw liquidity on Uniswap V2 pools.</p>
      </div>
      <LiquidityPanel />
    </div>
  );
}
