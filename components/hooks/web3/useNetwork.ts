import { CryptoHookFactory } from "@_types/hooks";
import useSWR from "swr";

const NETWORKS: { [k: string]: string } = {
  1: "Ethereum Main Network",
  3: "Ropsten Test Network",
  4: "Rinkeby Test Network",
  5: "Goerli Test Network",
  42: "Kovan Test Network",
  56: "Binance Smart Chain",
  1337: "Ganache",
};

const targetId = process.env.NEXT_PUBLIC_TARGET_CHAIN_ID as string;
const targetNetwork = NETWORKS[targetId];

type useNetworkResponse = {
  isLoading: boolean;
  isSupported: boolean;
  targetNetwork: string;
};
type NetworkHookFactory = CryptoHookFactory<string, useNetworkResponse>;

//returnType is a generic type
export type UseNetworkHook = ReturnType<NetworkHookFactory>;

// deps -> provider,ethereum, contract(web3State)
// dependencies -> params
export const hookFactory: NetworkHookFactory =
  ({ provider, isLoading }) =>
  () => {
    //   CONDITIONAL USESWR CALL
    // isValidation is true whenever you are retrievnig a new data
    const { data, isValidating, ...swr } = useSWR(
      provider ? "web3/useNetwork" : null,
      async () => {
        // every network has a different chain id
        // I put ! because if not provider, callback wont call anyways
        // getNetwork().name returns the name of the account that you set
        const chainId = (await provider!.getNetwork()).chainId;
        if (!chainId) {
          throw "Cannot retreive network. Please, refresh browser or connect to other one.";
        }

        return NETWORKS[chainId];
      },
      {
        // otherwise when I click on the window, it would run the function again
        revalidateOnFocus: false,
      }
    );

    return {
      ...swr,
      isValidating,
      data,
      targetNetwork,
      isSupported: data === targetNetwork,
      isLoading: isLoading as boolean,
    };
  };
