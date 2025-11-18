"use client";
import { useState, useEffect } from "react";
import { getTransaction } from "@wagmi/core";
import { config } from "@/config/wagmi";
import { CHAIN_ID } from "@/types";

export type TxStatus =
  | "idle"
  | "signing"
  | "pending"
  | "included"
  | "confirmed";

interface UseTransactionStatusProps {
  hash: `0x${string}` | null;
  chainId: CHAIN_ID | undefined;
}

export const useTransactionStatus = ({
  hash,
  chainId,
}: UseTransactionStatusProps) => {
  const [status, setStatus] = useState<TxStatus>("idle");
  const [blockNumber, setBlockNumber] = useState<bigint | undefined>(undefined);

  useEffect(() => {
    if (!hash || !chainId) {
      setStatus("idle");
      setBlockNumber(undefined);
      return;
    }

    let intervalId: NodeJS.Timeout;

    const checkTransactionStatus = async () => {
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
    };

    // Check immediately
    checkTransactionStatus();

    // Poll every 3 seconds
    intervalId = setInterval(checkTransactionStatus, 3000);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [hash, chainId]);

  return {
    status,
    blockNumber,
  };
};
