"use client";
import { useState, useEffect } from "react";
import { CHAIN_ID } from "@/types";
import { fetchTransactionWithRetry } from "@/utils/transactionHelpers";

export type TxStatus = "idle" | "signing" | "pending" | "included" | "confirmed";

interface UseTransactionStatusProps {
  hash: `0x${string}` | null;
  chainId: CHAIN_ID | undefined;
}

const POLL_INTERVAL = 3000;

export const useTransactionStatus = ({
  hash,
  chainId,
}: UseTransactionStatusProps) => {
  const [status, setStatus] = useState<TxStatus>("idle");
  const [blockNumber, setBlockNumber] = useState<bigint | undefined>(undefined);

  useEffect(() => {
    if (!hash || !chainId) return;

    const checkStatus = async () => {
      const tx = await fetchTransactionWithRetry(hash, chainId, 1);
      if (tx?.blockNumber !== null) {
        setStatus("included");
        setBlockNumber(tx?.blockNumber);
      } else {
        setStatus("pending");
      }
    };

    const intervalId = setInterval(checkStatus, POLL_INTERVAL);
    return () => clearInterval(intervalId);
  }, [hash, chainId]);

  return { status, blockNumber };
};
