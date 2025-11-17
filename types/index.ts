import { type Address } from "viem";

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

export type CHAIN_ID = 1 | 11155111 | 100 | 8453 | 84532;
