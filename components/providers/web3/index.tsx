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
import { MetaMaskInpageProvider } from "@metamask/providers";
import { NftMarketContract } from "@_types/nftMarketContract";

const pageReload = () => window.location.reload();

const handleAccount = (ethereum: MetaMaskInpageProvider) => async () => {
  const isLocked = !(await ethereum._metamask.isUnlocked());
  if (isLocked) {
    pageReload();
  }
};

// this has to be set once globally. metamask suggests
const setGlobalListeners = (ethereum: MetaMaskInpageProvider) => {
  ethereum.on("chainChanged", pageReload);
  ethereum.on("accountsChanged", handleAccount(ethereum));
};
const removeGlobalListeners = (ethereum: MetaMaskInpageProvider) => {
  ethereum?.removeListener("chainChanged", pageReload);
  ethereum?.removeListener("accountsChanged", handleAccount(ethereum));
};

const Web3Context = createContext<Web3State>(createDefaultState());

type Web3ProviderProps = {
  children?: ReactNode;
};

const Web3Provider: FunctionComponent<Web3ProviderProps> = ({ children }) => {
  const [web3Api, setWeb3Api] = useState<Web3State>(createDefaultState());

  useEffect(() => {
    async function initWeb3() {
      try {
        const provider = new ethers.providers.Web3Provider(
          // ask here
          window.ethereum as any
        );

        setTimeout(() => setGlobalListeners(window.ethereum), 400);
        const contract = await loadContract("NftMarket", provider);
        // this is connected account in Metamask
        const signer = provider.getSigner();
        // otherwise we would get our nfts
        const signedContract = contract.connect(signer);
        setWeb3Api(
          createWeb3State({
            ethereum: window.ethereum,
            provider,
            // Conversion of type 'Contract' to type 'NftMarketContract' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
            contract: signedContract as unknown as NftMarketContract,
            isLoading: false,
          })
        );
      } catch (error: any) {
        console.log("error in provider", error);
        setWeb3Api((prevState) =>
          createWeb3State({ ...(prevState as any), isLoading: false })
        );
      }
    }
    initWeb3();
    return () => removeGlobalListeners(window.ethereum);
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
