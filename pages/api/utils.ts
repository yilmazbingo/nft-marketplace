import { withIronSessionApiRoute } from "iron-session/next";
import { NextApiRequest, NextApiResponse } from "next";
import { ethers } from "ethers";

import { NftMarketContract } from "@_types/nftMarketContract";
import contract from "../../public/contracts/NftMarket.json";
import * as util from "ethereumjs-util";

const NETWORKS = {
  "5777": "Ganache",
};

type NETWORK = typeof NETWORKS;

const targetNetwork = process.env.NEXT_PUBLIC_NETWORK_ID as keyof NETWORK;
const abi = contract.abi;

export const contractAddress = contract["networks"][targetNetwork]["address"];
export const pinataApiKey = process.env.PINATA_API_KEY as string;
export const pinataSecretApiKey = process.env.PINATA_SECRET_KEY as string;
// handle is the wrapper function
export function withSession(handler: any) {
  return withIronSessionApiRoute(handler, {
    password: process.env.SECRET_COOKIE_PASSWORD as string,
    cookieName: "nft-auth-session",
    //  Said in another way, the browser will not send a cookie with the secure attribute set over an unencrypted HTTP request
    cookieOptions: {
      secure: process.env.NODE_ENV === "production" ? true : false,
    },
  });
}

export const addressCheckMiddleware = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  return new Promise(async (resolve, reject) => {
    const message = req.session.messageSession;
    // getting contract on serverside
    const provider = new ethers.providers.JsonRpcProvider(
      "http://127.0.0.1:7545"
    );
    const contract = new ethers.Contract(
      contractAddress,
      abi,
      provider
    ) as unknown as NftMarketContract;
    console.log("messge", message);
    // we need to get the unsigned message
    // nonce is the representation of something that we are going to sign
    let nonce: string | Buffer =
      "\x19Ethereum Signed Message:\n" +
      JSON.stringify(message).length +
      JSON.stringify(message);

    nonce = util.keccak(Buffer.from(nonce, "utf-8"));
    const { v, r, s } = util.fromRpcSig(req.body.signature);
    // matching signature with the unsigned message
    const pubKey = util.ecrecover(util.toBuffer(nonce), v, r, s);
    const addressBuffer = util.pubToAddress(pubKey);
    const address = util.bufferToHex(addressBuffer);
    console.log(address);
    if (address === req.body.address) {
      resolve("Correct Address");
    } else {
      reject("Wrong Address");
    }
  });
};
