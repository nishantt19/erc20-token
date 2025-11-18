"use client";
import { useState, useEffect, useCallback } from "react";

interface TransactionTimerProps {
  startTime: number;
}

const UPDATE_INTERVAL = 1000;

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins === 0 ? `${secs}s` : `${mins}m ${secs}s`;
};

export const TransactionTimer = ({ startTime }: TransactionTimerProps) => {
  const [elapsedTime, setElapsedTime] = useState(0);

  const updateElapsedTime = useCallback(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    setElapsedTime(elapsed);
  }, [startTime]);

  useEffect(() => {
    updateElapsedTime();
    const interval = setInterval(updateElapsedTime, UPDATE_INTERVAL);
    return () => clearInterval(interval);
  }, [updateElapsedTime]);

  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">Transaction Timer:</span>
      <span className="font-medium font-mono">{formatTime(elapsedTime)}</span>
    </div>
  );
};
