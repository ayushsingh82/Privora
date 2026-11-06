import { getAddress, isAddress, zeroAddress, type Address } from "viem";
import { CHAIN } from "./ethereum/chains";
import { readClient } from "./ethereum/read-client";
import { erc20Abi } from "./uniswap/abis";

export interface Token {
  address: Address; // zeroAddress = native ETH
  symbol: string;
  name: string;
  decimals: number;
  native?: boolean;
}

export const ETH: Token = { address: zeroAddress, symbol: "ETH", name: "Ether", decimals: 18, native: true };
export const WETH: Token = { address: CHAIN.weth, symbol: "WETH", name: "Wrapped Ether", decimals: 18 };

// Only well-known tokens; metadata of anything else is read from chain and validated.
const MAINNET_EXTRA: Token[] = [
  { address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", symbol: "USDC", name: "USD Coin", decimals: 6 },
  { address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", symbol: "DAI", name: "Dai Stablecoin", decimals: 18 },
  { address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", symbol: "USDT", name: "Tether USD", decimals: 6 },
];
// Sepolia test versions of popular tokens. Each was verified onchain to have a Uniswap V2 pool against WETH with reserves.
const SEPOLIA_EXTRA: Token[] = [
  { address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", symbol: "USDC", name: "USD Coin", decimals: 6 },
  { address: "0x779877A7B0D9E8603169DdbD7836e478b4624789", symbol: "LINK", name: "Chainlink", decimals: 18 },
  { address: "0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357", symbol: "DAI", name: "Dai Stablecoin", decimals: 18 },
  { address: "0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0", symbol: "USDT", name: "Tether USD", decimals: 6 },
  { address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", symbol: "UNI", name: "Uniswap", decimals: 18 },
];
/** Popular tokens for this network: shown in the token selector and as featured pools. */
export const FEATURED_TOKENS: Token[] = CHAIN.id === 1 ? MAINNET_EXTRA : SEPOLIA_EXTRA;
export const DEFAULT_TOKENS: Token[] = [ETH, WETH, ...FEATURED_TOKENS];

/** Wrapped form used in router paths. */
export const wrapped = (t: Token): Address => (t.native ? CHAIN.weth : t.address);

const clean = (s: string) => s.replace(/[^\x20-\x7E]/g, "").slice(0, 16) || "?";

/** Reads + validates token metadata from chain (through the active read transport). */
export async function lookupToken(input: string): Promise<Token> {
  if (!isAddress(input)) throw new Error("Not a valid address");
  const address = getAddress(input);
  // One batched request (Multicall3): symbol, name, decimals. Anything that is not an ERC-20 fails to decode.
  const [symbol, name, decimals] = await readClient
    .multicall({
      multicallAddress: "0xcA11bde05977b3631167028862bE2a173976CA11",
      allowFailure: false,
      contracts: [
        { address, abi: erc20Abi, functionName: "symbol" },
        { address, abi: erc20Abi, functionName: "name" },
        { address, abi: erc20Abi, functionName: "decimals" },
      ],
    })
    .catch(() => {
      throw new Error("Not a standard ERC-20 contract on " + CHAIN.name);
    });
  if (decimals > 36) throw new Error("Unreasonable decimals");
  return { address, symbol: clean(symbol), name: clean(name), decimals };
}
