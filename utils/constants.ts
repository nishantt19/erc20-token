import { sepolia, mainnet, gnosis, base, baseSepolia } from "viem/chains";

export const MORALIS_CHAIN_MAP: Record<number, string> = {
  1: "eth",
  11155111: "sepolia",
  100: "gnosis",
  8453: "base",
  84532: "base sepolia",
} as const;

export const ALCHEMY_NETWORK_SLUGS: Record<number, string> = {
  [mainnet.id]: "eth-mainnet",
  [sepolia.id]: "eth-sepolia",
  [base.id]: "base-mainnet",
  [baseSepolia.id]: "base-sepolia",
  [gnosis.id]: "gnosis-mainnet",
};

export const GAS_CONSTANTS = {
  STANDARD_TRANSFER_GAS: BigInt(21000),
  ERC20_TRANSFER_GAS: BigInt(65000),
  BUFFER_PERCENT: BigInt(4),
  MINIMUM_BUFFER_NATIVE_TOKEN: "0.0002",
  FALLBACK_RESERVE_NATIVE_TOKEN: "0.001",
  NATIVE_TOKEN_DECIMALS: 18,
} as const;

export const BIGINT_ZERO = BigInt(0);

export const PERCENTAGE_OPTIONS = [25, 50, 75, 100] as const;
