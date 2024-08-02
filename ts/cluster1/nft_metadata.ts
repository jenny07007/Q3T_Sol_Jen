import { WALLETS, RPC_ENDPOINT } from "../config";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createGenericFile,
  createSignerFromKeypair,
  signerIdentity,
} from "@metaplex-foundation/umi";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";

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
    // Follow this JSON structure
    // https://docs.metaplex.com/programs/token-metadata/changelog/v1.0#json-structure
    const imageURI =
      "https://arweave.net/LiThHB1T8EP_Dn3B93mB2EOAoVfS0dQyYbIC6XDiC5s";
    const metadata = {
      name: "Generug",
      symbol: "GENERUG",
      description:
        "Generug is a collection of 10,000 generative art NFTs on Solana.",
      image: imageURI,
      attributes: [
        { trait_type: "Background", value: "Green" },
        { trait_type: "Foreground", value: "Blue" },
      ],
      properties: {
        files: [
          {
            type: "image/png",
            uri: imageURI,
          },
        ],
      },
      creators: [],
    };
    const uri = await umi.uploader.uploadJson(metadata);
    console.log("Your metadata URI: ", uri);
  } catch (error) {
    console.log("Oops.. Something went wrong", error);
  }
})();
