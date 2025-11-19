"use client";
import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import {
  sendTransaction,
  writeContract,
  waitForTransactionReceipt,
} from "@wagmi/core";
import { erc20Abi, parseUnits } from "viem";
import { toast } from "sonner";

import type { TransferFormValues } from "@/schema/transferSchema";
import type { TransactionEstimate, TransactionStatus, CHAIN_ID } from "@/types";

import { TokenAmountInput, AddressInput } from "@/components/main/input";
import { TransactionEstimation } from "@/components/main/TransactionEstimation";
import { TransactionSuccess } from "@/components/main/TransactionSuccess";
import { useTransferForm } from "@/hooks/useTransferForm";
import { useWalletTokens } from "@/hooks/useWalletTokens";
import { useGasFees } from "@/hooks/useGasFees";
import { useTransactionEstimation } from "@/hooks/useTransactionEstimation";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { useTransactionStatus } from "@/hooks/useTransactionStatus";
import { config } from "@/config/wagmi";
import { truncateHash } from "@/utils/utils";

const AUTO_HIDE_DELAY = 10000;

const TransferCard = () => {
  const { isConnected, chainId } = useAccount();
  const { nativeToken } = useWalletTokens();
  const [isProcessing, setIsProcessing] = useState(false);
  const [txStatus, setTxStatus] = useState<"idle" | "signing" | "pending">(
    "idle"
  );
  const [transactionEstimate, setTransactionEstimate] =
    useState<TransactionEstimate | null>(null);
  const [currentTxStatus, setCurrentTxStatus] =
    useState<TransactionStatus | null>(null);
  const [completedTx, setCompletedTx] = useState<TransactionStatus | null>(
    null
  );

  const {
    token,
    handleTokenSelect,
    handleSubmit,
    register,
    setValue,
    formState: { errors },
    getValues,
    control,
    reset,
  } = useTransferForm({ initialToken: nativeToken });

  const selectedToken = isConnected ? token : null;
  const { gasFees } = useGasFees();
  const { refetchBalance } = useTokenBalance(selectedToken, undefined);
  const { estimateTransaction } = useTransactionEstimation();

  const { status: liveStatus, blockNumber } = useTransactionStatus({
    hash: currentTxStatus?.hash ?? null,
    chainId: chainId as CHAIN_ID | undefined,
  });

  useEffect(() => {
    if (completedTx) {
      const timer = setTimeout(() => {
        setCompletedTx(null);
      }, AUTO_HIDE_DELAY);

      return () => clearTimeout(timer);
    }
  }, [completedTx]);

  const handleTransactionSuccess = useCallback(
    async (
      hash: `0x${string}`,
      data: TransferFormValues,
      submittedAt: number
    ) => {
      const receipt = await waitForTransactionReceipt(config, {
        hash,
        confirmations: 2,
      });

      const confirmedAt = Date.now();
      const completionTimeSeconds = Math.floor(
        (confirmedAt - submittedAt) / 1000
      );

      console.log("Transaction completed:", {
        submittedAt,
        confirmedAt,
        completionTimeSeconds,
      });

      toast.dismiss();

      if (receipt.status === "success") {
        setCompletedTx({
          hash,
          status: "confirmed",
          blockNumber: receipt.blockNumber,
          submittedAt,
          confirmedAt,
          completionTimeSeconds,
          amount: data.amount,
          recipient: data.recipient,
          tokenSymbol: selectedToken!.symbol,
          isNativeToken: selectedToken!.native_token,
        });

        toast.success("Transfer successful!", {
          description: `Sent ${data.amount} ${
            selectedToken!.symbol
          } to ${data.recipient.slice(0, 6)}...${data.recipient.slice(-4)}`,
        });

        reset({
          amount: "",
          recipient: "",
          tokenAddress: selectedToken!.token_address,
        });

        await refetchBalance();
        setTransactionEstimate(null);
        setCurrentTxStatus(null);
      } else {
        toast.error("Transaction failed", {
          description: "The transaction was reverted",
        });
        setTransactionEstimate(null);
        setCurrentTxStatus(null);
      }
    },
    [selectedToken, reset, refetchBalance]
  );

  const handleTransactionEstimate = useCallback(
    async (hash: `0x${string}`) => {
      if (gasFees && chainId) {
        const estimate = await estimateTransaction(
          hash,
          gasFees,
          chainId as CHAIN_ID
        );
        if (estimate) {
          setTransactionEstimate(estimate);
          toast.loading("Transaction pending...", {
            description: `Hash: ${truncateHash(
              hash
            )}\nEstimated time: ~${Math.floor(
              estimate.estimatedWaitTime / 1000
            )}s`,
          });
        } else {
          toast.loading("Transaction pending...", {
            description: `Hash: ${truncateHash(hash)}`,
          });
        }
      } else {
        toast.loading("Transaction pending...", {
          description: `Hash: ${truncateHash(hash)}`,
        });
      }
    },
    [gasFees, chainId, estimateTransaction]
  );

  const handleError = useCallback(
    (error: Error & { message?: string }) => {
      toast.dismiss();
      setTransactionEstimate(null);
      setCurrentTxStatus(null);

      if (error?.message?.includes("User rejected")) {
        toast.error("Transaction rejected", {
          description: "You rejected the transaction in your wallet",
        });
      } else if (error?.message?.includes("insufficient funds")) {
        toast.error("Insufficient funds", {
          description: selectedToken?.native_token
            ? "You don't have enough balance to cover the transfer and gas fees"
            : "You don't have enough balance for this transfer or gas fees",
        });
      } else if (error?.message?.includes("gas")) {
        toast.error("Gas estimation failed", {
          description: "Unable to estimate gas for this transaction",
        });
      } else {
        toast.error("Transfer failed", {
          description: error?.message || "An unknown error occurred",
        });
      }

      console.error("Transfer error:", error);
    },
    [selectedToken]
  );

  const onSubmit = useCallback(
    async (data: TransferFormValues) => {
      if (!selectedToken) {
        toast.error("No token selected");
        return;
      }

      setIsProcessing(true);
      setTxStatus("signing");
      setTransactionEstimate(null);
      setCurrentTxStatus(null);
      setCompletedTx(null);

      try {
        const amountInWei = parseUnits(data.amount, selectedToken.decimals);
        let hash: `0x${string}`;

        if (selectedToken.native_token) {
          toast.loading("Initiating Native Token transfer...");
          hash = await sendTransaction(config, {
            to: data.recipient as `0x${string}`,
            value: amountInWei,
          });
        } else {
          toast.loading("Initiating ERC20 Token transfer...");
          hash = await writeContract(config, {
            address: selectedToken.token_address,
            abi: erc20Abi,
            functionName: "transfer",
            args: [data.recipient as `0x${string}`, amountInWei],
          });
        }

        toast.dismiss();
        setTxStatus("pending");

        const submittedAt = Date.now();

        setCurrentTxStatus({
          hash,
          status: "pending",
          submittedAt,
          amount: data.amount,
          recipient: data.recipient,
          tokenSymbol: selectedToken.symbol,
          isNativeToken: selectedToken.native_token,
        });

        await handleTransactionEstimate(hash);
        await handleTransactionSuccess(hash, data, submittedAt);
      } catch (error) {
        handleError(error as Error);
      } finally {
        setIsProcessing(false);
        setTxStatus("idle");
      }
    },
    [
      selectedToken,
      handleTransactionEstimate,
      handleTransactionSuccess,
      handleError,
    ]
  );

  const getButtonText = () => {
    if (!isConnected) return "Connect Wallet to Continue";
    if (!isProcessing) return "Send Tokens";
    return txStatus === "signing"
      ? "Confirm in Wallet..."
      : "Transaction Pending...";
  };

  return (
    <div className="w-full flex flex-col gap-y-0">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full bg-card rounded-3xl p-2.5 flex flex-col gap-y-2.5"
      >
        <div className="flex flex-col gap-y-2">
          <TokenAmountInput
            label="Amount"
            placeholder="0"
            register={register("amount")}
            error={errors.amount?.message}
            selectedToken={selectedToken}
            onTokenSelect={handleTokenSelect}
            setValue={setValue}
            fieldName="amount"
            getValues={getValues}
            control={control}
          />
          <AddressInput
            label="Recipient Address"
            placeholder="0x..."
            register={register("recipient")}
            error={errors.recipient?.message}
          />
        </div>
        <button
          disabled={!isConnected || isProcessing}
          className="py-4 px-5 rounded-2xl bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:bg-primary/60 disabled:cursor-not-allowed text-foreground text-lg font-semibold cursor-pointer"
        >
          {getButtonText()}
        </button>
      </form>

      {currentTxStatus && transactionEstimate && (
        <TransactionEstimation
          estimate={transactionEstimate}
          startTime={currentTxStatus.submittedAt}
          blockNumber={blockNumber}
          status={liveStatus === "included" ? "included" : "pending"}
          networkCongestion={gasFees?.networkCongestion}
        />
      )}

      {completedTx && chainId && (
        <TransactionSuccess
          hash={completedTx.hash}
          amount={completedTx.amount}
          tokenSymbol={completedTx.tokenSymbol}
          completionTimeSeconds={completedTx.completionTimeSeconds!}
          isNativeToken={completedTx.isNativeToken}
          chainId={chainId as CHAIN_ID}
        />
      )}
    </div>
  );
};

export default TransferCard;
