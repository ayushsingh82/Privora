// Centralised network + Uniswap V2 contract config. Addresses are the canonical, unmodified Uniswap V2 deployments.
import type { Address } from "viem";

export interface ChainConfig {
  id: number;
  name: string;
  rpc: string;
  explorer: string;
  factory: Address;
  router: Address;
  weth: Address;
  nativeSymbol: string;
}

const CHAINS: Record<number, ChainConfig> = {
  11155111: {
    id: 11155111,
    name: "Sepolia",
    rpc: process.env.NEXT_PUBLIC_RPC_URL_SEPOLIA || "https://ethereum-sepolia-rpc.publicnode.com",
    explorer: "https://sepolia.etherscan.io",
    factory: "0xF62c03E08ada871A0bEb309762E260a7a6a880E6",
    router: "0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3",
    weth: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14",
    nativeSymbol: "ETH",
  },
  1: {
    id: 1,
    name: "Ethereum",
    rpc: process.env.NEXT_PUBLIC_RPC_URL_MAINNET || "https://ethereum-rpc.publicnode.com",
    explorer: "https://etherscan.io",
    factory: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
    router: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
    weth: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    nativeSymbol: "ETH",
  },
};

const wanted = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 11155111);
export const CHAIN: ChainConfig = CHAINS[wanted] ?? CHAINS[11155111];
export const SUPPORTED_CHAIN_IDS = Object.keys(CHAINS).map(Number);
