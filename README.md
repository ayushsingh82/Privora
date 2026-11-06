# PrivateSwap

**Swap privately. Read anonymously.** — Uniswap V2, powered by [Anon-RPC](https://github.com/ethereum/anon-rpc).

PrivateSwap is a Uniswap V2 interface whose Ethereum **read layer** goes through Anon-RPC. Balances, allowances,
pool reserves, quotes, LP positions and token metadata are fetched through a hash-pinned, sandboxed anonymising
worker, so the RPC provider no longer sees *your IP address next to your wallet's query pattern*.

It is **not** a new AMM and does not change Uniswap V2's contracts or math. It talks to the canonical, unmodified
Uniswap V2 factory/router (addresses verified onchain, see `src/lib/ethereum/chains.ts`).

> Anon-RPC anonymises chain **reads**. Transactions are signed and broadcast by your wallet and are public onchain.
> PrivateSwap never claims otherwise.

## Why

Every `eth_getBalance`, `allowance`, or `getReserves` call from a normal dapp is a request from your IP to an RPC
company: *"this IP cares about this address and this pool."* That links your network identity to your wallet before
you ever sign anything. PrivateSwap removes that link for the read path.

## Architecture

```
                        PRIVATESWAP FRONTEND (Next.js)
                                   |
                         PRIVACY MODE (header toggle)
                         /                          \
                  Anon-RPC (default)            Standard RPC (opt-in)
                        |                              |
        browser-harness worker (hash-pinned,        plain fetch()
        null-origin iframe, mixnet exit)                |
                        \                              /
                         +---- rpcRead()  <- single, fail-closed choke point; logs method + transport only
                                   |
                       viem PublicClient (custom transport) + Multicall3 batching
                                   |
                       Uniswap V2 Factory / Pairs / Router (onchain reads)

   WRITES: wallet (EIP-1193, window.ethereum) -> approve / swap / add / remove -> NOT anonymised
   RECEIPTS: polled through the read transport (follows the selected mode)
```

Key files: `src/lib/anon-rpc/manager.ts` (worker lifecycle, fail-closed transport, request log),
`src/lib/ethereum/read-client.ts` (viem client on that transport), `src/lib/ethereum/wallet.ts` (separate write path).

## Features

- **Swap** — token selector with onchain address lookup/validation, router `getAmountsOut` quote (direct or via WETH),
  price impact, minimum received, 0.3% fee, slippage, exact-amount ERC-20 approval, swap (ETH↔token, token↔token).
- **Liquidity** — add (new or existing pool), remove (25/50/75/100%), LP position + pool share, LP approval.
- **Pools** — newest factory pairs, search by token address(es) or pair address, live reserves, deep links.
- **Privacy Center** — worker status, integrity status, per-transport counters, live request log (method, time,
  transport, success/failure, duration, error), comparison, "kill worker" fail-closed demo.
- **Fail-closed** — in Anon-RPC mode a missing/failed worker blocks reads with a visible error. Never silent fallback.

## Run it

```bash
cd privateswap
npm install
cp .env.example .env.local     # optional; defaults work
npm run dev                    # http://localhost:3200
```

Production: `npm run build && npm start`.

Needs a browser wallet (MetaMask/Rabby) on **Sepolia** for transactions (default chain; set
`NEXT_PUBLIC_CHAIN_ID=1` for mainnet). Reads work without a wallet.

## Environment

All variables are public config; **no secrets are needed**. See `.env.example`.

| Variable | Default | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_CHAIN_ID` | `11155111` | `11155111` (Sepolia) or `1` (mainnet) |
| `NEXT_PUBLIC_RPC_URL_SEPOLIA` / `_MAINNET` | publicnode | RPC used directly in Standard mode and by the exit node in Anon-RPC mode |
| `NEXT_PUBLIC_ANON_RPC_NETWORK` | `nox` | `nox`, `tor-js`, `nym` |

## Tests

```bash
npm test          # unit: V2 math vectors + fail-closed/transport tests (no network)
npm run typecheck
npm run build && npm start   # in one shell, then:
npm run e2e       # real headless Chrome: worker boot, anonymised quote, direct mode, fail-closed
npm run e2e:tx    # real UI on a local anvil Sepolia fork: swap, approve, add & remove liquidity (see script header)
```

`npm run e2e` needs Google Chrome (override with `CHROME=/path`). Results: [docs/TEST_REPORT.md](docs/TEST_REPORT.md).

## Docs

[Project audit](docs/PROJECT_AUDIT.md) · [Anon-RPC integration](docs/ANON_RPC_INTEGRATION.md) ·
[Demo script](docs/DEMO_SCRIPT.md) · [Test report](docs/TEST_REPORT.md)

## Limitations (honest list)

- Anon-RPC public networks are experimental: latency is seconds per request and exits can be unavailable
  (e.g. Nox exits that offer TLS tunnels are few; the app retries and self-heals but can still fail visibly).
- Writes (approve/swap/add/remove) and the wallet's own RPC are **not** anonymised.
- The worker bootstrap (one read of the network's specifier contract) is a direct, non-anonymised request, and the
  page/JS load itself reveals your IP to the host. Both are shown in the Privacy Center.
- Wallet-signed flows are tested on a local Sepolia fork with a stub wallet, not with a real extension or a public
  network (see test report). ERC-20↔ERC-20 swaps are implemented but not covered by the tx e2e.
- Token symbols/names are read from the contract and sanitised but are still user-controlled strings: verify addresses.
- Sepolia Uniswap V2 pools are test pools with arbitrary liquidity.

## Licence / attribution

MIT. Written from scratch against the published Uniswap V2 contract interfaces; no Uniswap interface (GPL-3.0) source
is copied. "Uniswap" is a trademark of its owners; this is an unaffiliated hackathon project.
