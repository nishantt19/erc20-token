import { CHAIN_ID } from "@/types";

type CongestionLevel = "low" | "medium" | "high";

const BLOCK_EXPLORERS: Record<CHAIN_ID, string> = {
  1: "https://etherscan.io",
  11155111: "https://sepolia.etherscan.io",
  100: "https://gnosisscan.io",
  8453: "https://basescan.org",
  84532: "https://sepolia.basescan.org",
};

const CONGESTION_COLORS: Record<CongestionLevel, string> = {
  low: "text-green-500",
  medium: "text-yellow-500",
  high: "text-red-500",
};

const CONGESTION_LABELS: Record<CongestionLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const getBlockExplorerUrl = (chainId: CHAIN_ID): string =>
  BLOCK_EXPLORERS[chainId];

export const getTransactionUrl = (
  chainId: CHAIN_ID,
  txHash: `0x${string}`
): string => `${getBlockExplorerUrl(chainId)}/tx/${txHash}`;

export const getNetworkCongestionLevel = (
  congestion: number
): CongestionLevel => {
  if (congestion < 0.33) return "low";
  if (congestion < 0.66) return "medium";
  return "high";
};

export const getCongestionColor = (level: CongestionLevel): string =>
  CONGESTION_COLORS[level];

export const getCongestionLabel = (level: CongestionLevel): string =>
  CONGESTION_LABELS[level];
