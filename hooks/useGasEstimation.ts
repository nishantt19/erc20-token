import { useMemo, useState, useCallback } from "react";
import { erc20Abi, parseUnits } from "viem";
import { useAccount, useBalance } from "wagmi";
import { estimateGas, getPublicClient, getGasPrice } from "@wagmi/core";

import { CHAIN_ID, type Token } from "@/types";
import { calculateRequiredGasAmount } from "@/utils/utils";
import { BIGINT_ZERO, GAS_CONSTANTS } from "@/utils/constants";
import { config } from "@/config/wagmi";

export const useGasEstimation = () => {
  const { address, chainId } = useAccount();
  const { data: balance } = useBalance({ address });

  const client = useMemo(
    () => getPublicClient(config, { chainId: chainId as CHAIN_ID }),
    [chainId]
  );

  const [showGasError, setShowGasError] = useState(false);
  const [isEstimating, setIsEstimating] = useState(false);

  const getRequiredGasAmount = useCallback(async (
    token: Token,
    amountWei: bigint,
    to: `0x${string}`
  ): Promise<bigint> => {
    if (!address || !amountWei || Number(amountWei) === 0) {
      setShowGasError(false);
      return BIGINT_ZERO;
    }

    setIsEstimating(true);
    setShowGasError(false);

    try {
      const gasPrice = await getGasPrice(config, { chainId: chainId as CHAIN_ID });
      let gasEstimate: bigint;

      if (token.native_token) {
        try {
          gasEstimate = await estimateGas(config, {
            chainId: chainId as CHAIN_ID,
            account: address,
            to,
            value: amountWei,
          });
        } catch (error) {
          console.error("Error estimating gas for native token", error);
          gasEstimate = GAS_CONSTANTS.STANDARD_TRANSFER_GAS;
        }
      } else {
        try {
          gasEstimate = await client.estimateContractGas({
            account: address,
            address: token.token_address,
            abi: erc20Abi,
            functionName: "transfer",
            args: [to, amountWei],
          });
        } catch (error) {
          console.error("Error estimating gas for erc20", error);
          gasEstimate = GAS_CONSTANTS.ERC20_TRANSFER_GAS;
        }
      }

      const requiredGas = calculateRequiredGasAmount(gasEstimate, gasPrice);
      const nativeTokenBalance = balance?.value ?? BIGINT_ZERO;

      if (token.native_token) {
        setShowGasError(nativeTokenBalance - amountWei < requiredGas);
      } else {
        setShowGasError(nativeTokenBalance < requiredGas);
      }

      return requiredGas;
    } catch (error) {
      console.error("Unexpected error estimating gas", error);
      setShowGasError(true);
      return parseUnits(
        GAS_CONSTANTS.FALLBACK_RESERVE_NATIVE_TOKEN,
        GAS_CONSTANTS.NATIVE_TOKEN_DECIMALS
      );
    } finally {
      setIsEstimating(false);
    }
  }, [address, chainId, client, balance]);

  return {
    isEstimating,
    showGasError,
    getRequiredGasAmount,
  };
};
