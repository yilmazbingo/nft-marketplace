import { Web3Dependencies } from "@_types/hooks";
import {
  hookFactory as createAcccountHook,
  UseAccountHook,
} from "./useAccount";

export type Web3Hooks = {
  useAccount: UseAccountHook;
};

export type SetupHooks = {
  (d: Web3Dependencies): Web3Hooks;
};

export const setupHooks: SetupHooks = (deps) => {
  return {
    useAccount: createAcccountHook(deps),
  };
};
