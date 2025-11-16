import { type Address } from "viem";
import { MORALIS_CHAIN_MAP } from "@/utils/constants";

export type Token = {
  token_address: Address;
  name: string;
  symbol: string;
  logo: string | null;
  decimals: number;
  balance: string;
  usd_price: string;
  balance_formatted: string;
  native_token: boolean;
};

export type CHAIN_ID = keyof typeof MORALIS_CHAIN_MAP;
