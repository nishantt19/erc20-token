"use client";
import { useState, useEffect } from "react";

interface TransactionTimerProps {
  startTime: number; // timestamp in milliseconds
}

export const TransactionTimer = ({ startTime }: TransactionTimerProps) => {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const updateElapsedTime = () => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000); // Convert to seconds
      setElapsedTime(elapsed);
    };

    // Update immediately
    updateElapsedTime();

    // Update every second
    const interval = setInterval(updateElapsedTime, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    if (mins === 0) {
      return `${secs}s`;
    }

    return `${mins}m ${secs}s`;
  };

  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">Transaction Timer:</span>
      <span className="font-medium font-mono">{formatTime(elapsedTime)}</span>
    </div>
  );
};
