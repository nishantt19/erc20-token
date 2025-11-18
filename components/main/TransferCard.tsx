"use client";
import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import {
  sendTransaction,
  writeContract,
  waitForTransactionReceipt,
} from "@wagmi/core";
import { erc20Abi, parseUnits } from "viem";
import { toast } from "sonner";

import { TransferFormValues } from "@/schema/transferSchema";
import {
  TransactionEstimate as TransactionEstimateType,
  TransactionStatus,
  CHAIN_ID,
} from "@/types";

import { TokenAmountInput, AddressInput } from "@/components/main/input";
import { TransactionEstimate } from "@/components/main/TransactionEstimate";
import { TransactionStatusCard } from "@/components/main/TransactionStatusCard";
import { CompletionDetailsCard } from "@/components/main/CompletionDetailsCard";
import { useTransferForm } from "@/hooks/useTransferForm";
import { useWalletTokens } from "@/hooks/useWalletTokens";
import { useGasFees } from "@/hooks/useGasFees";
import { useTransactionEstimation } from "@/hooks/useTransactionEstimation";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { useTransactionStatus } from "@/hooks/useTransactionStatus";
import { config } from "@/config/wagmi";

const TransferCard = () => {
  const { isConnected, chainId } = useAccount();
  const { nativeToken } = useWalletTokens();
  const [isProcessing, setIsProcessing] = useState(false);
  const [txStatus, setTxStatus] = useState<"idle" | "signing" | "pending">(
    "idle"
  );
  const [transactionEstimate, setTransactionEstimate] =
    useState<TransactionEstimateType | null>(null);
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

  // Fetch gas fees from Infura API
  const { gasFees } = useGasFees();

  // Get refetch function for the selected token's balance
  const { refetchBalance } = useTokenBalance(selectedToken, undefined);

  // Hook for transaction estimation
  const { estimateTransaction } = useTransactionEstimation();

  // Monitor transaction status (pending vs included in block)
  const { status: liveStatus, blockNumber } = useTransactionStatus({
    hash: currentTxStatus?.hash ?? null,
    chainId: chainId as CHAIN_ID | undefined,
  });

  // Auto-hide completion card after 10 seconds
  useEffect(() => {
    if (completedTx) {
      const timer = setTimeout(() => {
        setCompletedTx(null);
      }, 10000); // 10 seconds

      return () => clearTimeout(timer);
    }
  }, [completedTx]);

  const onSubmit = async (data: TransferFormValues) => {
    if (!selectedToken) {
      toast.error("No token selected");
      return;
    }

    setIsProcessing(true);
    setTxStatus("signing");
    setTransactionEstimate(null); // Reset previous estimate
    setCurrentTxStatus(null); // Reset current transaction
    setCompletedTx(null); // Reset completed transaction

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

      // Capture submission time
      const submittedAt = Date.now();

      // Set current transaction status
      setCurrentTxStatus({
        hash,
        status: "pending",
        submittedAt,
        amount: data.amount,
        recipient: data.recipient,
        tokenSymbol: selectedToken.symbol,
        isNativeToken: selectedToken.native_token,
      });

      // Estimate transaction after it's been submitted
      if (gasFees && chainId) {
        const estimate = await estimateTransaction(
          hash,
          gasFees,
          chainId as CHAIN_ID
        );
        if (estimate) {
          setTransactionEstimate(estimate);
          toast.loading("Transaction pending...", {
            description: `Hash: ${hash.slice(0, 10)}...${hash.slice(
              -8
            )}\nEstimated time: ~${Math.floor(
              estimate.estimatedWaitTime / 1000
            )}s`,
          });
        } else {
          toast.loading("Transaction pending...", {
            description: `Hash: ${hash.slice(0, 10)}...${hash.slice(-8)}`,
          });
        }
      } else {
        toast.loading("Transaction pending...", {
          description: `Hash: ${hash.slice(0, 10)}...${hash.slice(-8)}`,
        });
      }

      const receipt = await waitForTransactionReceipt(config, {
        hash,
        confirmations: 2,
      });

      // Capture the exact time when receipt is received
      const confirmedAt = Date.now();
      // Calculate elapsed time in seconds (matching the timer's calculation)
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
        // Set completed transaction data
        setCompletedTx({
          hash,
          status: "confirmed",
          blockNumber: receipt.blockNumber,
          submittedAt,
          confirmedAt,
          completionTimeSeconds,
          amount: data.amount,
          recipient: data.recipient,
          tokenSymbol: selectedToken.symbol,
          isNativeToken: selectedToken.native_token,
        });

        toast.success("Transfer successful!", {
          description: `Sent ${data.amount} ${
            selectedToken.symbol
          } to ${data.recipient.slice(0, 6)}...${data.recipient.slice(-4)}`,
        });
        // Reset only amount and recipient, keep tokenAddress
        reset({
          amount: "",
          recipient: "",
          tokenAddress: selectedToken.token_address,
        });
        await refetchBalance();
        setTransactionEstimate(null);
        setCurrentTxStatus(null); // Clear pending transaction
      } else {
        toast.error("Transaction failed", {
          description: "The transaction was reverted",
        });
        setTransactionEstimate(null);
        setCurrentTxStatus(null);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.dismiss();
      setTransactionEstimate(null);
      setCurrentTxStatus(null);

      if (error?.message?.includes("User rejected")) {
        toast.error("Transaction rejected", {
          description: "You rejected the transaction in your wallet",
        });
      } else if (error?.message?.includes("insufficient funds")) {
        toast.error("Insufficient funds", {
          description: selectedToken.native_token
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
    } finally {
      setIsProcessing(false);
      setTxStatus("idle");
    }
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
          {!isConnected
            ? "Connect Wallet to Continue"
            : isProcessing
            ? txStatus === "signing"
              ? "Confirm in Wallet..."
              : "Transaction Pending..."
            : "Send Tokens"}
        </button>
      </form>

      {transactionEstimate && (
        <TransactionEstimate
          estimate={transactionEstimate}
          nativeSymbol={nativeToken?.symbol}
        />
      )}

      {/* Transaction Status Card - shown while transaction is pending */}
      {currentTxStatus && (
        <TransactionStatusCard
          startTime={currentTxStatus.submittedAt}
          blockNumber={blockNumber}
          status={liveStatus === "included" ? "included" : "pending"}
          networkCongestion={gasFees?.networkCongestion}
        />
      )}

      {/* Completion Details Card - shown after transaction is confirmed */}
      {completedTx && chainId && (
        <CompletionDetailsCard
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
