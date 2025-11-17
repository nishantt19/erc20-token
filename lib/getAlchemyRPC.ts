import { http } from "viem";
import { ALCHEMY_NETWORK_SLUGS } from "@/utils/constants";

export const getAlchemyTransport = (chainId: number) => {
  const slug = ALCHEMY_NETWORK_SLUGS[chainId];

  if (!slug) {
    throw new Error(`Missing Alchemy slug for chain id ${chainId}`);
  }

  return http(
    `https://${slug}.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_KEY}`
  );
};
