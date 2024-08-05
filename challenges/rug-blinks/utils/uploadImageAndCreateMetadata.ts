import {
  createGenericFile,
  createSignerFromKeypair,
  signerIdentity,
} from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";
import path from "path";
import dev_wallet from "../dev-wallet.json";
import { readFile } from "fs/promises";

const umi = createUmi("https://api.devnet.solana.com");
const keypair = umi.eddsa.createKeypairFromSecretKey(
  new Uint8Array(dev_wallet),
);
const singer = createSignerFromKeypair(umi, keypair);

umi.use(irysUploader());
umi.use(signerIdentity(singer));

// Function to upload an image and return its URI
async function uploadImage(imagePath: string): Promise<string> {
  const image = await readFile(imagePath);
  const genericFile = createGenericFile(image, path.basename(imagePath), {
    contentType: "image/png",
  });

  console.log("Uploading image...");
  const [imageURI] = await umi.uploader.upload([genericFile]);
  console.log("Image URI:", imageURI);

  return imageURI;
}

// Function to create metadata for the NFT
function createMetadata(imageURI: string): object {
  return {
    name: "SuperRUG",
    symbol: "SUPERRUG",
    description: "Super RUG for Blinks!!!",
    image: imageURI,
    attributes: [
      { trait_type: "rarity", value: "high" },
      { trait_type: "color", value: "neon" },
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
}

// Function to upload metadata and return its URI
async function uploadMetadata(metadata: object): Promise<string> {
  console.log("Creating metadata...");
  const uri = await umi.uploader.uploadJson(metadata);
  console.log("Metadata URI:", uri);
  return uri;
}

// Main function to upload image and create metadata
export async function uploadImageAndCreateMetadata(): Promise<
  string | undefined
> {
  try {
    const imagePath = path.join(__dirname, "../rug/generug.png");
    const imageURI = await uploadImage(imagePath);
    const metadata = createMetadata(imageURI);
    return await uploadMetadata(metadata);
  } catch (error) {
    console.error("Error uploading image and creating metadata:", error);
  }
}
