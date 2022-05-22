import { CryptoHookFactory } from "@_types/hooks";
import { Nft } from "@_types/nft";
import { ethers } from "ethers";
import { useCallback } from "react";
import useSWR from "swr";

type UseOwnedNftsResponse = {
  listNft: (tokenId: number, price: number) => Promise<void>;
};
type OwnedNftsHookFactory = CryptoHookFactory<Nft[], UseOwnedNftsResponse>;

export type UseOwnedNftsHook = ReturnType<OwnedNftsHookFactory>;

export const hookFactory: OwnedNftsHookFactory =
  ({ contract }) =>
  () => {
    const { data, ...swr } = useSWR(
      contract ? "web3/useOwnedNfts" : null,
      async () => {
        const nfts = [] as Nft[];
        const coreNfts = await contract!.getOwnedNfts();
        // console.log("corenfts in Owned nfts", coreNfts);
        for (let i = 0; i < coreNfts.length; i++) {
          const item = coreNfts[i];
          const tokenURI = await contract!.tokenURI(item.tokenId);
          const metaRes = await fetch(tokenURI);
          console.log("metaRes in used owned hook ", metaRes);
          let meta;
          try {
            meta = await metaRes.json();
          } catch (error) {
            console.log("error in json fetch in owned nfts", error);
          }

          console.log("meta", meta);
          nfts.push({
            price: parseFloat(ethers.utils.formatEther(item.price)),
            tokenId: item.tokenId.toNumber(),
            creator: item.creator,
            isListed: item.isListed,
            meta,
          });
        }
        console.log("nfts---", nfts);
        return nfts;
      }
    );

    // React Hook useCallback has an unnecessary dependency: 'contract'. Either exclude it or remove the dependency array. Outer scope values like 'contract' aren't valid dependencies because mutating them doesn't re-render the component.
    // since contract is passed from outer scope, I need to create a new constant as inner obj
    const _contract = contract;
    const listNft = useCallback(
      async (tokenId: number, price: number) => {
        try {
          const result = await _contract?.placeNftOnSale(
            tokenId,
            ethers.utils.parseEther(price.toString()),
            { value: ethers.utils.parseEther((0.25).toString()) }
          );
          await result?.wait();
          alert("Item has been listed");
        } catch (e) {
          console.error(e);
        }
      },
      [_contract]
    );
    return {
      ...swr,
      data: data || [],
      listNft,
    };
  };
