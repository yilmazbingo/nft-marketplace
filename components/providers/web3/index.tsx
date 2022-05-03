import {
  createContext,
  FunctionComponent,
  ReactNode,
  useContext,
  useState,
  useEffect,
} from "react";

import { ethers } from "ethers";
import {
  createDefaultState,
  createWeb3State,
  loadContract,
  Web3State,
} from "./utils";

const Web3Context = createContext<Web3State>(createDefaultState());

type Web3ProviderProps = {
  children?: ReactNode;
};

const Web3Provider: FunctionComponent<Web3ProviderProps> = ({ children }) => {
  const [web3Api, setWeb3Api] = useState<Web3State>(createDefaultState());

  useEffect(() => {
    async function initWeb3() {
      const provider = new ethers.providers.Web3Provider(
        window.ethereum as any
      );
      const contract = await loadContract("NftMarket", provider);
      setWeb3Api(
        createWeb3State({
          ethereum: window.ethereum,
          provider,
          contract,
          isLoading: false,
        })
      );
    }
    initWeb3();
  }, []);

  return (
    <Web3Context.Provider value={web3Api}>{children}</Web3Context.Provider>
  );
};

// to consume the provider we have to use the context

export function useWeb3() {
  return useContext(Web3Context);
}

export function useHooks() {
  const { hooks } = useWeb3();
  return hooks;
}

export default Web3Provider;
// go to tsconfig.json and create paths for the providers
