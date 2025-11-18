"use client";
import { useState, useEffect, useCallback } from "react";
import { getTransaction } from "@wagmi/core";
import { config } from "@/config/wagmi";
import { CHAIN_ID } from "@/types";

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

  const checkTransactionStatus = useCallback(async () => {
    if (!hash || !chainId) return;

    try {
      const tx = await getTransaction(config, {
        hash,
        chainId,
      });

      if (tx.blockNumber !== null) {
        setStatus("included");
        setBlockNumber(tx.blockNumber);
      } else {
        setStatus("pending");
      }
    } catch (error) {
      console.error("Error checking transaction status:", error);
    }
  }, [hash, chainId]);

  useEffect(() => {
    if (!hash || !chainId) {
      setStatus("idle");
      setBlockNumber(undefined);
      return;
    }

    checkTransactionStatus();

    const intervalId = setInterval(checkTransactionStatus, POLL_INTERVAL);

    return () => clearInterval(intervalId);
  }, [hash, chainId, checkTransactionStatus]);

  return {
    status,
    blockNumber,
  };
};
