import { useMemo } from "react";
import { formatUnits, erc20Abi } from "viem";
import { useAccount, useReadContract, useBalance } from "wagmi";
import { type Token } from "@/types";
import { formatBalance, calculateUsdValue } from "@/utils/utils";

export const useTokenBalance = (token: Token | null, amount?: string) => {
  const { address } = useAccount();

  // Fetch native token balance using useBalance
  const { data: nativeBalanceData, refetch: refetchNativeBalance } = useBalance(
    {
      address: address,
      query: {
        enabled: !!token?.native_token && !!address,
      },
    }
  );

  // Fetch ERC20 token balance using useReadContract
  const { data: erc20BalanceData, refetch: refetchERC20Balance } =
    useReadContract({
      address: token?.token_address as `0x${string}`,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [address as `0x${string}`],
      query: {
        enabled: !!token && !token.native_token && !!address,
      },
    });

  // Get live balance from blockchain only
  const liveBalance = useMemo(() => {
    if (!token) return "0";

    if (token.native_token) {
      return nativeBalanceData?.value.toString() ?? "0";
    }

    return erc20BalanceData?.toString() ?? "0";
  }, [token, nativeBalanceData, erc20BalanceData]);

  const balance = useMemo(
    () => (token ? formatUnits(BigInt(liveBalance), token.decimals) : "0"),
    [token, liveBalance]
  );

  const formattedBalance = useMemo(
    () => (token ? parseFloat(formatBalance(liveBalance, token.decimals)) : 0),
    [token, liveBalance]
  );

  const usdValue = useMemo(
    () => (token && amount ? calculateUsdValue(amount, token) : "0.00"),
    [token, amount]
  );

  const isInsufficientBalance = useMemo(() => {
    if (!amount || !token) return false;
    const currentAmount = parseFloat(amount);
    const tokenBalance = parseFloat(balance);
    return currentAmount > tokenBalance;
  }, [amount, balance, token]);

  // Unified refetch function that refetches the appropriate balance
  const refetchBalance = async () => {
    if (!token) return;

    if (token.native_token) {
      await refetchNativeBalance();
    } else {
      await refetchERC20Balance();
    }
  };

  return {
    balance,
    balanceInWei: liveBalance,
    formattedBalance,
    usdValue,
    isInsufficientBalance,
    refetchBalance,
  };
};
