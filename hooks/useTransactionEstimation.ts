import { useCallback } from "react";
import { parseGwei, formatGwei } from "viem";
import type {
  InfuraGasResponse,
  GasTier,
  TransactionEstimate,
  CHAIN_ID,
} from "@/types";
import { fetchTransactionWithRetry } from "@/utils/transactionHelpers";

export const useTransactionEstimation = () => {
  const detectGasTier = useCallback(
    (
      txMaxPriorityFee: bigint,
      txMaxFee: bigint,
      gasMetrics: InfuraGasResponse
    ): GasTier => {
      const tierPriorityFees = {
        low: parseGwei(gasMetrics.low.suggestedMaxPriorityFeePerGas),
        medium: parseGwei(gasMetrics.medium.suggestedMaxPriorityFeePerGas),
        high: parseGwei(gasMetrics.high.suggestedMaxPriorityFeePerGas),
      };

      const tierMaxFees = {
        low: parseGwei(gasMetrics.low.suggestedMaxFeePerGas),
        medium: parseGwei(gasMetrics.medium.suggestedMaxFeePerGas),
        high: parseGwei(gasMetrics.high.suggestedMaxFeePerGas),
      };

      if (txMaxPriorityFee <= tierPriorityFees.low) return "low";
      if (txMaxPriorityFee <= tierPriorityFees.medium) return "medium";
      if (txMaxPriorityFee <= tierPriorityFees.high) return "high";
      if (txMaxFee <= tierMaxFees.low) return "low";
      if (txMaxFee <= tierMaxFees.medium) return "medium";

      return "high";
    },
    []
  );

  const estimateTransaction = useCallback(
    async (
      txHash: `0x${string}`,
      gasMetrics: InfuraGasResponse,
      chainId: CHAIN_ID
    ): Promise<TransactionEstimate | null> => {
      try {
        const transaction = await fetchTransactionWithRetry(txHash, chainId);
        if (!transaction) {
          console.error("Transaction not found after retries");
          return null;
        }

        const actualMaxPriorityFee =
          transaction.maxPriorityFeePerGas || transaction.gasPrice || BigInt(0);
        const actualMaxFee =
          transaction.maxFeePerGas || transaction.gasPrice || BigInt(0);

        const tier = detectGasTier(
          actualMaxPriorityFee,
          actualMaxFee,
          gasMetrics
        );
        // this estimated wait time should be dependent on network congestion too.
        const estimatedWaitTime = gasMetrics[tier].maxWaitTimeEstimate;

        const gasLimit = transaction.gas;
        const estimatedBaseFee = parseGwei(gasMetrics.estimatedBaseFee);
        const effectiveGasPrice = estimatedBaseFee + actualMaxPriorityFee;
        const estimatedGasCost = gasLimit * effectiveGasPrice;

        console.log("Transaction Estimation:", {
          tier,
          estimatedWaitTime: `${estimatedWaitTime / 1000}s`,
          maxPriorityFeePerGas: formatGwei(actualMaxPriorityFee),
          maxFeePerGas: formatGwei(actualMaxFee),
          gasLimit: gasLimit.toString(),
          estimatedGasCost: estimatedGasCost.toString(),
          networkCongestion: gasMetrics.networkCongestion,
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
