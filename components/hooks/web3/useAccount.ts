import { CryptoHookFactory } from "@_types/hooks";
import { useEffect } from "react";
import useSWR from "swr";

type useAccountResponse = {
  connect: () => void;
};
type AccountHookFactory = CryptoHookFactory<string, useAccountResponse>;

//returnType is a generic type
export type UseAccountHook = ReturnType<AccountHookFactory>;

// deps -> provider,ethereum, contract(web3State)
// dependencies -> params
export const hookFactory: AccountHookFactory =
  ({ provider, ethereum }) =>
  () => {
    //   CONDITIONAL USESWR CALL
    const swrRes = useSWR(
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
      }
    );

    const handleAccountsChanged = (...args: unknown[]) => {
      const accounts = args[0] as string[];
      if (accounts.length === 0) {
        console.log("Please connect to metamask");
        // our old data is not current connected account
      } else if (accounts[0] !== swrRes.data) {
        // if account changed we can mutate the data in the hook.
        swrRes.mutate(accounts[0]);
      }
    };
    useEffect(() => {
      ethereum?.on("accountsChanged", handleAccountsChanged);
      return () => {
        ethereum?.removeListener("accountsChanged", handleAccountsChanged);
      };
    });

    const connect = async () => {
      try {
        ethereum?.request({ method: "eth_requestAccounts" });
      } catch (error) {
        console.log("error in connecting to wallet", error);
      }
    };
    return { ...swrRes, connect };
  };
