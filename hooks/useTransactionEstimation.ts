import { useCallback } from "react";
import { parseGwei, formatGwei } from "viem";
import { getTransaction } from "@wagmi/core";
import { config } from "@/config/wagmi";
import { InfuraGasResponse, GasTier, TransactionEstimate, CHAIN_ID } from "@/types";

const MAX_RETRIES = 5;
const RETRY_DELAY = 1000;

export const useTransactionEstimation = () => {
  const detectGasTier = useCallback(
    (txMaxPriorityFee: bigint, txMaxFee: bigint, gasFees: InfuraGasResponse): GasTier => {
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
      gasFees: InfuraGasResponse,
      chainId: CHAIN_ID
    ): Promise<TransactionEstimate | null> => {
      try {
        let transaction = null;
        let retries = 0;

        while (!transaction && retries < MAX_RETRIES) {
          try {
            transaction = await getTransaction(config, {
              hash: txHash,
              chainId,
            });
          } catch (error) {
            retries++;
            if (retries < MAX_RETRIES) {
              console.log(`Transaction not found yet, retrying (${retries}/${MAX_RETRIES})...`);
              await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            }
          }
        }

        if (!transaction) {
          console.error("Transaction not found after retries");
          return null;
        }

        const maxPriorityFeePerGas = transaction.maxPriorityFeePerGas ?? BigInt(0);
        const maxFeePerGas = transaction.maxFeePerGas ?? BigInt(0);
        const actualMaxPriorityFee = maxPriorityFeePerGas || transaction.gasPrice || BigInt(0);
        const actualMaxFee = maxFeePerGas || transaction.gasPrice || BigInt(0);

        const tier = detectGasTier(actualMaxPriorityFee, actualMaxFee, gasFees);
        const estimatedWaitTime = gasFees[tier].maxWaitTimeEstimate;

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
