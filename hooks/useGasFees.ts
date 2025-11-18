import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import axios from "axios";
import { InfuraGasResponse } from "@/types";

export const useGasFees = () => {
  const { chainId } = useAccount();

  const {
    data: gasFees,
    isLoading,
    error,
  } = useQuery<InfuraGasResponse>({
    queryKey: ["gasFees", chainId],
    queryFn: async () => {
      if (!chainId) throw new Error("No chain ID available");

      const response = await axios.get<InfuraGasResponse>(
        `https://gas.api.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_KEY}/networks/${chainId}/suggestedGasFees`
      );
      return response.data;
    },
    enabled: !!chainId,
    staleTime: 12000, // 12 seconds - gas prices change frequently
    refetchInterval: 12000, // Refetch every 12 seconds
  });

  return {
    gasFees,
    isLoading,
    error,
  };
};
