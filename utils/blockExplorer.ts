import { CHAIN_ID } from "@/types";

/**
 * Get block explorer URL for a given chain
 */
export const getBlockExplorerUrl = (chainId: CHAIN_ID): string => {
  const explorers: Record<CHAIN_ID, string> = {
    1: "https://etherscan.io", // Mainnet
    11155111: "https://sepolia.etherscan.io", // Sepolia
    100: "https://gnosisscan.io", // Gnosis
    8453: "https://basescan.org", // Base
    84532: "https://sepolia.basescan.org", // Base Sepolia
  };

  return explorers[chainId];
};

/**
 * Get transaction URL on block explorer
 */
export const getTransactionUrl = (
  chainId: CHAIN_ID,
  txHash: `0x${string}`
): string => {
  const baseUrl = getBlockExplorerUrl(chainId);
  return `${baseUrl}/tx/${txHash}`;
};

/**
 * Get address URL on block explorer
 */
export const getAddressUrl = (
  chainId: CHAIN_ID,
  address: `0x${string}`
): string => {
  const baseUrl = getBlockExplorerUrl(chainId);
  return `${baseUrl}/address/${address}`;
};

/**
 * Format transaction hash for display (first 6 + ... + last 4)
 */
export const formatTxHash = (hash: `0x${string}`): string => {
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
};

/**
 * Get network congestion level based on networkCongestion value (0-1)
 */
export const getNetworkCongestionLevel = (
  congestion: number
): "low" | "medium" | "high" => {
  if (congestion < 0.33) return "low";
  if (congestion < 0.66) return "medium";
  return "high";
};

/**
 * Get network congestion color class
 */
export const getCongestionColor = (
  level: "low" | "medium" | "high"
): string => {
  switch (level) {
    case "low":
      return "text-green-500";
    case "medium":
      return "text-yellow-500";
    case "high":
      return "text-red-500";
  }
};

/**
 * Get network congestion label
 */
export const getCongestionLabel = (
  level: "low" | "medium" | "high"
): string => {
  switch (level) {
    case "low":
      return "Low";
    case "medium":
      return "Medium";
    case "high":
      return "High";
  }
};
