import { type Address } from "viem";

export type Token = {
  token_address: Address;
  name: string;
  symbol: string;
  logo: string | null;
  decimals: number;
  balance: string;
  usd_price: string;
  balance_formatted: string;
  native_token: boolean;
};

export type CHAIN_ID = 1 | 11155111 | 100 | 8453 | 84532;

export type GasTier = "low" | "medium" | "high";

export type GasFeeEstimate = {
  suggestedMaxPriorityFeePerGas: string;
  suggestedMaxFeePerGas: string;
  minWaitTimeEstimate: number;
  maxWaitTimeEstimate: number;
};

export type InfuraGasResponse = {
  low: GasFeeEstimate;
  medium: GasFeeEstimate;
  high: GasFeeEstimate;
  estimatedBaseFee: string;
  networkCongestion: number;
  latestPriorityFeeRange: [string, string];
  historicalPriorityFeeRange: [string, string];
  historicalBaseFeeRange: [string, string];
  priorityFeeTrend: "up" | "down";
  baseFeeTrend: "up" | "down";
};

export type TransactionEstimate = {
  tier: GasTier;
  estimatedWaitTime: number;
  estimatedGasCost: bigint;
  gasUsed: bigint;
};

export type TransactionStatus = {
  hash: `0x${string}`;
  status: "pending" | "included" | "confirmed";
  blockNumber?: bigint;
  submittedAt: number;
  confirmedAt?: number;
  completionTimeSeconds?: number;
  amount: string;
  recipient: string;
  tokenSymbol: string;
  isNativeToken: boolean;
};

export type NetworkCongestionLevel = "low" | "medium" | "high";

export type TransactionStatusType =
  | "idle"
  | "pending"
  | "included"
  | "confirmed";
