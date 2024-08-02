import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createSignerFromKeypair,
  signerIdentity,
  generateSigner,
  percentAmount,
} from "@metaplex-foundation/umi";
import {
  createNft,
  mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata";

import base58 from "bs58";
import { WALLETS } from "../config";

const RPC_ENDPOINT = "https://api.devnet.solana.com";
const umi = createUmi(RPC_ENDPOINT);

let keypair = umi.eddsa.createKeypairFromSecretKey(
  new Uint8Array(WALLETS.WBA_WALLET),
);
const myKeypairSigner = createSignerFromKeypair(umi, keypair);

// 'use' umi plugin system
umi.use(signerIdentity(myKeypairSigner));
umi.use(mplTokenMetadata());

// the generateSigner() creates a new keypair will be used for the mint account
// when we create the NFT(cerateNft())
const mint = generateSigner(umi);

const metadataURI =
  "https://arweave.net/kKw0yCvo_DxeK49hKhZWdh2oUZMMX-HZmhDGKq-zr90";

(async () => {
  let tx = createNft(umi, {
    mint,
    name: "GENERUG",
    symbol: "GENERUG",
    uri: metadataURI,
    sellerFeeBasisPoints: percentAmount(25),
  });

  let result = await tx.sendAndConfirm(umi);
  const signature = base58.encode(result.signature);

  console.log(
    `Succesfully Minted! Check out your TX here:
     https://explorer.solana.com/tx/${signature}?cluster=devnet`,
  );

  console.log("Mint Address: ", mint.publicKey);
})();
