import { formatGwei } from "viem";
import { TransactionEstimate as TransactionEstimateType } from "@/types";

interface TransactionEstimateProps {
  estimate: TransactionEstimateType | null;
  nativeSymbol?: string;
}

const TIER_COLORS: Record<string, string> = {
  low: "text-yellow-500",
  medium: "text-blue-500",
  high: "text-green-500",
};

const TIER_LABELS: Record<string, string> = {
  low: "Low Priority",
  medium: "Medium Priority",
  high: "High Priority",
};

const formatWaitTime = (milliseconds: number): string => {
  const seconds = milliseconds / 1000;

  if (seconds < 1) return `~${seconds.toFixed(2)}s`;
  if (seconds < 60) return `~${Math.floor(seconds)}s`;

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  return remainingSeconds === 0
    ? `~${minutes}m`
    : `~${minutes}m ${remainingSeconds}s`;
};

export const TransactionEstimate = ({
  estimate,
  nativeSymbol = "ETH",
}: TransactionEstimateProps) => {
  if (!estimate) return null;

  const tierColor = TIER_COLORS[estimate.tier] || "text-gray-500";
  const tierLabel = TIER_LABELS[estimate.tier] || estimate.tier;
  const formattedGasCost = parseFloat(
    formatGwei(estimate.estimatedGasCost)
  ).toFixed(3);

  return (
    <div className="w-full bg-card/50 rounded-2xl p-4 mt-2 flex flex-col gap-y-2 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Speed:</span>
        <span className={`font-medium ${tierColor}`}>{tierLabel}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Estimated Time:</span>
        <span className="font-medium">
          {formatWaitTime(estimate.estimatedWaitTime)}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Estimated Gas Cost:</span>
        <span className="font-medium">
          {formattedGasCost} {nativeSymbol}
        </span>
      </div>
    </div>
  );
};
