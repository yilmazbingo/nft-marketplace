import { CryptoHookFactory } from "@_types/hooks";
import { useEffect } from "react";
import useSWR from "swr";

type useAccountResponse = {
  connect: () => void;
  isLoading: boolean | undefined;
  isInstalled: boolean;
};
type AccountHookFactory = CryptoHookFactory<string, useAccountResponse>;

//returnType is a generic type
export type UseAccountHook = ReturnType<AccountHookFactory>;

// deps -> provider,ethereum, contract(web3State)
// dependencies -> params
export const hookFactory: AccountHookFactory =
  ({ provider, ethereum, isLoading }) =>
  () => {
    //   CONDITIONAL USESWR CALL
    // isValidation is true whenever you are retrievnig a new data
    const { data, mutate, isValidating, ...swr } = useSWR(
      provider ? "web3/useAccount" : null,
      async () => {
        // ! tells that I am sure that provider exists at this point
        const accounts = await provider!.listAccounts();
        const account = accounts[0];
        if (!account) {
          throw "Cannot retrieve account";
        }
        return account;
      },
      {
        // otherwise when I click on the window, it would run the function again
        revalidateOnFocus: false,
        shouldRetryOnError: false,
      }
    );

    const handleAccountsChanged = (...args: unknown[]) => {
      const accounts = args[0] as string[];
      if (accounts.length === 0) {
        console.log("Please connect to metamask");
        // our old data is not current connected account
      } else if (accounts[0] !== data) {
        // if account changed we can mutate the data in the hook so we return the updated the data
        mutate(accounts[0]);
      }
    };
    // since this does not have a dependency array it will run only once when the component is rendered for the first time only
    // because we are adding an event listener
    useEffect(() => {
      ethereum?.on("accountsChanged", handleAccountsChanged);
      return () => {
        ethereum?.removeListener("accountsChanged", handleAccountsChanged);
      };
    });

    const connect = async () => {
      try {
        // ethereum?.request({ method: "eth_requestAccounts" });
        ethereum?.request({ method: "eth_requestAccounts" });
      } catch (error) {
        console.log("error in connecting to wallet", error);
      }
    };
    return {
      ...swr,
      connect,
      isValidating,
      data,
      // when we transition to a new page, hook is reexecuted, and tries to fetch new data, this causes a flashing in ui
      // isValidation is True when you call the useSwr function, it does not matter whether you have data or not
      // isLoading: isLoading || isValidating,
      isLoading: isLoading,
      isInstalled: ethereum?.isMetaMask || false,
      mutate,
    };
  };
