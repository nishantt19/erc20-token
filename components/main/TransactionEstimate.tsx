import { formatEther } from "viem";
import { TransactionEstimate as TransactionEstimateType } from "@/types";

interface TransactionEstimateProps {
  estimate: TransactionEstimateType | null;
  nativeSymbol?: string;
}

export const TransactionEstimate = ({
  estimate,
  nativeSymbol = "ETH",
}: TransactionEstimateProps) => {
  if (!estimate) return null;

  const formatWaitTime = (milliseconds: number): string => {
    const seconds = milliseconds / 1000;

    // For values less than 1 second, show decimal
    if (seconds < 1) {
      return `~${seconds.toFixed(2)}s`;
    }

    // For values less than 60 seconds, show whole seconds
    if (seconds < 60) {
      return `~${Math.floor(seconds)}s`;
    }

    // For values 60+ seconds, show minutes
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    if (remainingSeconds === 0) {
      return `~${minutes}m`;
    }

    return `~${minutes}m ${remainingSeconds}s`;
  };

  const getTierColor = (tier: string): string => {
    switch (tier) {
      case "low":
        return "text-yellow-500";
      case "medium":
        return "text-blue-500";
      case "high":
        return "text-green-500";
      default:
        return "text-gray-500";
    }
  };

  const getTierLabel = (tier: string): string => {
    switch (tier) {
      case "low":
        return "Low Priority";
      case "medium":
        return "Medium Priority";
      case "high":
        return "High Priority";
      default:
        return tier;
    }
  };

  return (
    <div className="w-full bg-card/50 rounded-2xl p-4 mt-2 flex flex-col gap-y-2 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Speed:</span>
        <span className={`font-medium ${getTierColor(estimate.tier)}`}>
          {getTierLabel(estimate.tier)}
        </span>
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
          {parseFloat(formatEther(estimate.estimatedGasCost)).toFixed(6)} {nativeSymbol}
        </span>
      </div>
    </div>
  );
};
