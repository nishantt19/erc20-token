"use client";
import { useState } from "react";
import { IoCheckmark, IoCopy, IoOpenOutline } from "react-icons/io5";
import { getTransactionUrl } from "@/utils/blockExplorer";
import { CHAIN_ID } from "@/types";
import { truncateHash } from "@/utils/utils";

interface CompletionDetailsCardProps {
  hash: `0x${string}`;
  amount: string;
  tokenSymbol: string;
  completionTimeSeconds: number;
  isNativeToken: boolean;
  chainId: CHAIN_ID;
}

const COPY_RESET_DELAY = 2000;

const formatCompletionTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins === 0 ? `${secs}s` : `${mins}m ${secs}s`;
};

export const CompletionDetailsCard = ({
  hash,
  amount,
  tokenSymbol,
  completionTimeSeconds,
  isNativeToken,
  chainId,
}: CompletionDetailsCardProps) => {
  const [copied, setCopied] = useState(false);

  const explorerUrl = getTransactionUrl(chainId, hash);
  const transactionType = isNativeToken
    ? "Native asset transfer"
    : "ERC-20 token transfer";
  const formattedHash = truncateHash(hash);
  const formattedTime = formatCompletionTime(completionTimeSeconds);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopied(true);
      setTimeout(() => setCopied(false), COPY_RESET_DELAY);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="w-full bg-linear-to-br from-green-500/10 to-green-600/5 rounded-2xl p-4 mt-2 flex flex-col gap-y-2.5 text-sm border border-green-500/30">
      <div className="text-base font-semibold text-green-600 dark:text-green-400 mb-1 flex items-center gap-2">
        <IoCheckmark className="w-5 h-5" />
        Transaction Confirmed
      </div>

      <div className="flex flex-col gap-y-1">
        <span className="text-muted-foreground text-xs">Transaction Hash</span>
        <div className="flex items-center justify-between gap-2 bg-card/50 rounded-lg p-2">
          <span className="font-mono text-xs">{formattedHash}</span>
          <button
            onClick={handleCopy}
            className="p-1.5 hover:bg-muted rounded transition-colors"
            title="Copy full hash"
          >
            {copied ? (
              <IoCheckmark className="w-4 h-4 text-green-500" />
            ) : (
              <IoCopy className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Amount:</span>
        <span className="font-medium">
          {amount} {tokenSymbol}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Completion Time:</span>
        <span className="font-medium font-mono">{formattedTime}</span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Transaction Type:</span>
        <span className="font-medium">{transactionType}</span>
      </div>

      <a
        href={explorerUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 flex items-center justify-center gap-2 py-2.5 px-4 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors text-primary font-medium"
      >
        <span>View on Block Explorer</span>
        <IoOpenOutline className="w-4 h-4" />
      </a>
    </div>
  );
};
