// Pure Uniswap V2 constant-product math (0.3% fee). Mirrors UniswapV2Library.

export function getAmountOut(amountIn: bigint, reserveIn: bigint, reserveOut: bigint): bigint {
  if (amountIn <= 0n || reserveIn <= 0n || reserveOut <= 0n) return 0n;
  const inWithFee = amountIn * 997n;
  return (inWithFee * reserveOut) / (reserveIn * 1000n + inWithFee);
}

/** Price impact in basis points vs. the pre-trade mid price (fee excluded from "impact" the way the Uniswap UI does it). */
export function priceImpactBps(amountIn: bigint, amountOut: bigint, reserveIn: bigint, reserveOut: bigint): number {
  if (amountIn <= 0n || reserveIn <= 0n || reserveOut <= 0n) return 0;
  const ideal = (amountIn * reserveOut) / reserveIn; // out at mid price, no fee, no slippage
  if (ideal <= 0n) return 0;
  const bps = ((ideal - amountOut) * 10000n) / ideal;
  return Math.max(0, Number(bps));
}

export function minReceived(amountOut: bigint, slippageBps: number): bigint {
  return (amountOut * BigInt(10000 - slippageBps)) / 10000n;
}

/** Proportional quote used for adding liquidity to an existing pool. */
export function quote(amountA: bigint, reserveA: bigint, reserveB: bigint): bigint {
  if (amountA <= 0n || reserveA <= 0n || reserveB <= 0n) return 0n;
  return (amountA * reserveB) / reserveA;
}
