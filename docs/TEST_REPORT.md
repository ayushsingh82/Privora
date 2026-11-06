# Test report

Run date: 2026-11-06 · macOS · Node 24.22 · Chrome (headless, throwaway profile) · Sepolia · Nox network.

## Automated

| Suite | Command | Result |
| --- | --- | --- |
| Unit: V2 math (UniswapV2Library vector, impact, min-out, quote) | `npm test` | 5/5 pass |
| Unit: fail-closed (anon mode, no worker ⇒ `PrivacyError`, **0 `fetch` calls**, failure logged as `anon`) | `npm test` | pass |
| Unit: direct mode explicit, logged `direct`, counted separately | `npm test` | pass |
| Unit: log contains only `{id,ts,method,transport,ok,ms,error}` (no params) | `npm test` | pass |
| Typecheck | `npm run typecheck` | clean |
| Production build | `npm run build` | success (5 routes static) |
| Lint | — | **not configured**; no ESLint run |
| **Real-browser e2e** | `npm run e2e` | **8/8 steps, two consecutive full passes** (final) |

### e2e steps (real worker, real network, headless Chrome)

1. Anon-RPC worker boots (hash-pinned load) → status `ready` (3.5–12 s).
2. Pools page loads real V2 pairs through Anon-RPC.
3. Privacy Center: anonymised reads > 0, **direct reads = 0**, `eth_call / Anon-RPC / Success` rows.
4. Swap quote for Sepolia pair #311 via Anon-RPC: **1 WETH ≈ 1.458873 MTK** — equals the direct-RPC result
   (`getAmountsOut(1e12)` = 1.458873463888e12) from an independent check; direct reads still 0.
5. Standard mode generates `Direct RPC` rows.
6. Fail-closed: kill worker ⇒ "Anon-RPC unavailable" banner, direct-read counter unchanged (no silent fallback).
7. Restart worker recovers.

### Flakiness disclosed

Earlier runs failed intermittently, for real reasons:
- Network outage on the developer machine (all requests failed with `NoTunnelExitError`).
- Nox exits that offer TLS tunnels are scarce (`tls.exit.skipped` in worker logs): some sessions got none.
  Mitigations added (queue, retry, restart self-heal, Multicall3 batching) and then two clean consecutive passes.
  Expect occasional failures on the public mixnet; the app surfaces them as visible errors with Retry.
- A bug in the test itself (selector matched the header "Swap" link) — fixed.
- Other networks: tor-js did not boot within 150 s (demo gateway); Nym booted in ~36 s but reads timed out (~24 s).

## Not tested (be honest)

| Area | Status |
| --- | --- |
| Wallet connect / approve / swap / add / remove / remove-liquidity execution | Implemented against the real contracts and type-checked; **not executed** (needs a funded Sepolia wallet; no wallet automation here) |
| Allowance and LP-position reads in the UI | Same read path as tested balances/quotes; not exercised with a connected account |
| Mobile layout | Visually checked at 390–500 px screenshots only |
| Mainnet | Contract addresses verified onchain; no UI run on mainnet |
| Anon-RPC network anonymity properties | Out of scope: we test routing/transport, not the network's guarantees |
