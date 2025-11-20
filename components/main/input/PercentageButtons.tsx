"use client";
import { useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { type Token } from "@/types";
import { Tooltip } from "@/components/ui/Tooltip";
import { PERCENTAGE_OPTIONS } from "@/utils/constants";

type PercentageButtonsProps = {
  selectedToken: Token | null;
  isHovered: boolean;
  onPercentageClick: (percentage: number) => void;
};

const ANIMATION_CONFIG = {
  initial: { opacity: 0, scale: 0, y: -10 },
  exit: { opacity: 0, scale: 0, y: -10, transition: { duration: 0.2 } },
  transition: {
    duration: 0.3,
    type: "spring" as const,
    bounce: 0.5,
    stiffness: 300,
    damping: 15,
  },
};

export const PercentageButtons = ({
  selectedToken,
  isHovered,
  onPercentageClick,
}: PercentageButtonsProps) => {
  const handleClick = useCallback(
    (percentage: number) => () => {
      onPercentageClick(percentage);
    },
    [onPercentageClick]
  );

  if (!selectedToken || !isHovered) return null;

  return (
    <div className="flex gap-x-1.5 absolute right-0 -top-6">
      <AnimatePresence>
        {PERCENTAGE_OPTIONS.map((percentage, index) => {
          const isMaxButton = percentage === 100;
          const shouldShowTooltip = isMaxButton && selectedToken.native_token;

          const buttonContent = (
            <motion.button
              key={percentage}
              type="button"
              onClick={handleClick(percentage)}
              className="text-xs px-1.5 py-1 rounded-xl bg-select cursor-pointer hover:bg-select-hover text-secondary hover:text-foreground transition-colors border border-border-select"
              initial={ANIMATION_CONFIG.initial}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
                transition: {
                  ...ANIMATION_CONFIG.transition,
                  delay: index * 0.05,
                },
              }}
              exit={ANIMATION_CONFIG.exit}
            >
              {isMaxButton ? "MAX" : `${percentage}%`}
            </motion.button>
          );

          return shouldShowTooltip ? (
            <Tooltip
              key={percentage}
              content="A small portion of your balance is reserved for transaction gas fees"
              position="top"
              className="min-w-2xs"
            >
              {buttonContent}
            </Tooltip>
          ) : (
            buttonContent
          );
        })}
      </AnimatePresence>
    </div>
  );
};
