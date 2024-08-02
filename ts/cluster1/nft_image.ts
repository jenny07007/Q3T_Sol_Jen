import path from "path";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createGenericFile,
  createSignerFromKeypair,
  signerIdentity,
} from "@metaplex-foundation/umi";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";
import { readFile } from "fs/promises";
import { WALLETS, RPC_ENDPOINT } from "../config";

// Create a devnet connection
const umi = createUmi(RPC_ENDPOINT);

let keypair = umi.eddsa.createKeypairFromSecretKey(
  new Uint8Array(WALLETS.WBA_WALLET),
);
const signer = createSignerFromKeypair(umi, keypair);

umi.use(irysUploader());
umi.use(signerIdentity(signer));

(async () => {
  try {
    const image = await readFile(path.join(__dirname, "./images/generug.png"));

    const genericFile = createGenericFile(image, "generug.png", {
      contentType: "image/png",
    });

    console.log("Uploading image...");

    const [imageURI] = await umi.uploader.upload([genericFile]);

    console.log("Your image URI: ", imageURI);
  } catch (error) {
    console.log("Oops.. Something went wrong", error);
  }
})();
