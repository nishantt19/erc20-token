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
  networkCongestion?: number;
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

  const statusText = status === "pending"
    ? "Pending in mempool"
    : "Included in block — waiting for confirmations";

  const statusColor = status === "pending" ? "text-yellow-500" : "text-blue-500";

  return (
    <div className="w-full bg-card/50 rounded-2xl p-4 mt-2 flex flex-col gap-y-2 text-sm border border-primary/20">
      <div className="text-base font-semibold text-foreground mb-1">
        Transaction Status
      </div>

      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Pool Status:</span>
        <span className={`font-medium ${statusColor}`}>
          {statusText}
        </span>
      </div>

      <TransactionTimer startTime={startTime} />

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

      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Network Congestion:</span>
        <span className={`font-medium ${congestionColor}`}>
          {congestionLabel}
        </span>
      </div>
    </div>
  );
};
