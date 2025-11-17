import { useCallback } from "react";
import { parseGwei, formatGwei } from "viem";
import { getTransaction } from "@wagmi/core";
import { config } from "@/config/wagmi";
import { InfuraGasResponse, GasTier, TransactionEstimate, CHAIN_ID } from "@/types";

export const useTransactionEstimation = () => {
  /**
   * Detects which gas tier (low/medium/high) the transaction matches
   * Algorithm:
   * 1. Compare transaction's maxPriorityFeePerGas with tier suggestions
   * 2. Find the tier where the transaction's fee is within or below the suggested range
   * 3. If transaction exceeds all tiers, classify as "high"
   */
  const detectGasTier = useCallback(
    (txMaxPriorityFee: bigint, txMaxFee: bigint, gasFees: InfuraGasResponse): GasTier => {
      const tiers: GasTier[] = ["low", "medium", "high"];

      // Convert API string values (in Gwei) to bigint for comparison
      const tierPriorityFees = {
        low: parseGwei(gasFees.low.suggestedMaxPriorityFeePerGas),
        medium: parseGwei(gasFees.medium.suggestedMaxPriorityFeePerGas),
        high: parseGwei(gasFees.high.suggestedMaxPriorityFeePerGas),
      };

      const tierMaxFees = {
        low: parseGwei(gasFees.low.suggestedMaxFeePerGas),
        medium: parseGwei(gasFees.medium.suggestedMaxFeePerGas),
        high: parseGwei(gasFees.high.suggestedMaxFeePerGas),
      };

      // Check priority fee first (most important for miner inclusion)
      if (txMaxPriorityFee <= tierPriorityFees.low) {
        return "low";
      } else if (txMaxPriorityFee <= tierPriorityFees.medium) {
        return "medium";
      } else if (txMaxPriorityFee <= tierPriorityFees.high) {
        return "high";
      }

      // If priority fee exceeds all tiers, check max fee as secondary criteria
      if (txMaxFee <= tierMaxFees.low) {
        return "low";
      } else if (txMaxFee <= tierMaxFees.medium) {
        return "medium";
      }

      // Default to high if exceeds all suggested values
      return "high";
    },
    []
  );

  /**
   * Estimates transaction confirmation time and cost
   * This should be called AFTER the transaction is submitted
   *
   * @param txHash - Transaction hash returned from sendTransaction/writeContract
   * @param gasFees - Current gas fee data from Infura API
   * @param chainId - Current chain ID
   * @returns Promise<TransactionEstimate | null>
   */
  const estimateTransaction = useCallback(
    async (
      txHash: `0x${string}`,
      gasFees: InfuraGasResponse,
      chainId: CHAIN_ID
    ): Promise<TransactionEstimate | null> => {
      try {
        // Fetch the actual transaction details
        const transaction = await getTransaction(config, {
          hash: txHash,
          chainId,
        });

        if (!transaction) {
          console.error("Transaction not found");
          return null;
        }

        // EIP-1559 transactions (most modern transactions)
        const maxPriorityFeePerGas = transaction.maxPriorityFeePerGas ?? BigInt(0);
        const maxFeePerGas = transaction.maxFeePerGas ?? BigInt(0);

        // For legacy transactions (gasPrice), use gasPrice as both values
        const actualMaxPriorityFee = maxPriorityFeePerGas || transaction.gasPrice || BigInt(0);
        const actualMaxFee = maxFeePerGas || transaction.gasPrice || BigInt(0);

        // Detect which tier this transaction falls into
        const tier = detectGasTier(actualMaxPriorityFee, actualMaxFee, gasFees);

        // Get the estimated wait time for this tier
        const estimatedWaitTime = gasFees[tier].maxWaitTimeEstimate;

        // Calculate estimated gas cost
        // Gas cost = gasLimit * effectiveGasPrice
        // For EIP-1559: effectiveGasPrice ≈ baseFee + maxPriorityFeePerGas
        const gasLimit = transaction.gas;
        const estimatedBaseFee = parseGwei(gasFees.estimatedBaseFee);
        const effectiveGasPrice = estimatedBaseFee + actualMaxPriorityFee;
        const estimatedGasCost = gasLimit * effectiveGasPrice;

        console.log("Transaction Estimation:", {
          tier,
          estimatedWaitTime: `${estimatedWaitTime / 1000}s`,
          maxPriorityFeePerGas: formatGwei(actualMaxPriorityFee),
          maxFeePerGas: formatGwei(actualMaxFee),
          gasLimit: gasLimit.toString(),
          estimatedGasCost: estimatedGasCost.toString(),
        });

        return {
          tier,
          estimatedWaitTime,
          estimatedGasCost,
          gasUsed: gasLimit,
        };
      } catch (error) {
        console.error("Error estimating transaction:", error);
        return null;
      }
    },
    [detectGasTier]
  );

  return {
    estimateTransaction,
    detectGasTier,
  };
};
