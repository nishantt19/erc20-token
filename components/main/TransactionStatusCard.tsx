"use client";
import { TransactionTimer } from "./TransactionTimer";
import {
  getNetworkCongestionLevel,
  getCongestionColor,
  getCongestionLabel,
} from "@/utils/blockExplorer";

interface TransactionStatusCardProps {
  startTime: number;
  blockNumber?: bigint;
  status: "pending" | "included";
  networkCongestion?: number; // 0-1 value from Infura
}

export const TransactionStatusCard = ({
  startTime,
  blockNumber,
  status,
  networkCongestion = 0.5,
}: TransactionStatusCardProps) => {
  const congestionLevel = getNetworkCongestionLevel(networkCongestion);
  const congestionColor = getCongestionColor(congestionLevel);
  const congestionLabel = getCongestionLabel(congestionLevel);

  return (
    <div className="w-full bg-card/50 rounded-2xl p-4 mt-2 flex flex-col gap-y-2 text-sm border border-primary/20">
      <div className="text-base font-semibold text-foreground mb-1">
        Transaction Status
      </div>

      {/* Pool Status */}
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Pool Status:</span>
        <span className="font-medium">
          {status === "pending" ? (
            <span className="text-yellow-500">Pending in mempool</span>
          ) : (
            <span className="text-blue-500">
              Included in block — waiting for confirmations
            </span>
          )}
        </span>
      </div>

      {/* Transaction Timer */}
      <TransactionTimer startTime={startTime} />

      {/* Block Information */}
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Block:</span>
        <span className="font-medium font-mono">
          {blockNumber ? (
            <span className="text-blue-500">{blockNumber.toString()}</span>
          ) : (
            <span className="text-muted-foreground">Pending</span>
          )}
        </span>
      </div>

      {/* Network Congestion */}
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Network Congestion:</span>
        <span className={`font-medium ${congestionColor}`}>
          {congestionLabel}
        </span>
      </div>
    </div>
  );
};
