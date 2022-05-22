import { MetaMaskInpageProvider } from "@metamask/providers";
import { Contract, providers } from "ethers";
import { SWRResponse } from "swr";
import { NftMarketContract } from "./nftMarketContract";

export type Web3Dependencies = {
  provider: providers.Web3Provider;
  contract: NftMarketContract;
  ethereum: MetaMaskInpageProvider;
  isLoading: boolean;
};
// Data, Response,Parameter
export type CryptoHookFactory<D = any, R = any, P = any> = {
  // Partial Constructs a type with all properties of Type set to optional. This utility will return a type that represents all subsets of a given type.
  (d: Partial<Web3Dependencies>): CryptoHandlerHook<D, R, P>;
};

export type CryptoHandlerHook<D = any, R = any, P = any> = (
  params?: P
) => CryptoSWRResponse<D, R>;

export type CryptoSWRResponse<D = any, R = any> = SWRResponse<D> & R;
