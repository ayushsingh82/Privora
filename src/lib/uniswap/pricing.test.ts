import { test } from "node:test";
import assert from "node:assert/strict";
import { getAmountOut, minReceived, priceImpactBps, quote } from "./pricing.ts";

test("getAmountOut matches UniswapV2Library vector", () => {
  // 1e18 in, reserves 100e18 / 200e18 -> 1.97...e18 after 0.3% fee
  const out = getAmountOut(10n ** 18n, 100n * 10n ** 18n, 200n * 10n ** 18n);
  assert.equal(out, 1_974_316_068_794_122_597n);
});
test("zero reserves / zero input give zero", () => {
  assert.equal(getAmountOut(0n, 1n, 1n), 0n);
  assert.equal(getAmountOut(1n, 0n, 1n), 0n);
});
test("minReceived applies slippage", () => {
  assert.equal(minReceived(10_000n, 50), 9_950n);
});
test("price impact grows with trade size", () => {
  const r = 1_000_000n * 10n ** 18n;
  const small = priceImpactBps(10n ** 18n, getAmountOut(10n ** 18n, r, r), r, r);
  const big = priceImpactBps(100_000n * 10n ** 18n, getAmountOut(100_000n * 10n ** 18n, r, r), r, r);
  assert.ok(big > small);
});
test("quote is proportional", () => {
  assert.equal(quote(10n, 100n, 300n), 30n);
});
