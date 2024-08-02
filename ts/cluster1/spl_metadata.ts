import { WALLETS, ACCOUNTS, RPC_ENDPOINT } from "../config";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createMetadataAccountV3,
  CreateMetadataAccountV3InstructionAccounts,
  CreateMetadataAccountV3InstructionArgs,
  DataV2Args,
  findMetadataPda,
  updateMetadataAccountV2,
  UpdateMetadataAccountV2InstructionAccounts,
  UpdateMetadataAccountV2InstructionArgs,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  createSignerFromKeypair,
  signerIdentity,
  publicKey,
} from "@metaplex-foundation/umi";
import base58 from "bs58";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";

// Define our Mint address
const mint = publicKey(ACCOUNTS.MINT);

// Create a UMI connection
const umi = createUmi(RPC_ENDPOINT);

let keypair = umi.eddsa.createKeypairFromSecretKey(
  new Uint8Array(WALLETS.WBA_WALLET),
);
const signer = createSignerFromKeypair(umi, keypair);

umi.use(irysUploader());
umi.use(signerIdentity(signer));

(async () => {
  try {
    const metadataPDA = findMetadataPda(umi, { mint });

    let accounts: CreateMetadataAccountV3InstructionAccounts = {
      metadata: metadataPDA,
      mint,
      mintAuthority: signer,
      payer: signer,
      updateAuthority: keypair.publicKey,
    };

    let data: DataV2Args = {
      name: "Sunday Hike GOLD",
      symbol: "SHG",
      uri: "https://arweave.net/VYFKYwsj5mkzgXbCkhOfDBKq-jJyrrY7NtDqBb82al8",
      sellerFeeBasisPoints: 0,
      creators: null,
      collection: null,
      uses: null,
    };

    let args: CreateMetadataAccountV3InstructionArgs = {
      data,
      isMutable: true,
      collectionDetails: null,
    };

    let tx = createMetadataAccountV3(umi, {
      ...accounts,
      ...args,
    });

    // update metadata
    const metadata = {
      name: "Sunday Hike GOLD",
      symbol: "SHG",
      description:
        "A premium NFT representing a golden ticket for an exclusive Sunday hiking experience",
      image: "https://arweave.net/VYFKYwsj5mkzgXbCkhOfDBKq-jJyrrY7NtDqBb82al8",
    };

    const metadataUri = await umi.uploader.uploadJson(metadata);

    let accounts_for_update_metadata: UpdateMetadataAccountV2InstructionAccounts =
      {
        metadata: metadataPDA,
        updateAuthority: signer,
      };

    let data_for_update: DataV2Args = {
      name: "Sunday Hike GOLD",
      symbol: "SHG",
      uri: metadataUri,
      sellerFeeBasisPoints: 0,
      creators: null,
      collection: null,
      uses: null,
    };

    let args_for_update: UpdateMetadataAccountV2InstructionArgs = {
      data,
    };

    let tx_for_update = updateMetadataAccountV2(umi, {
      ...accounts_for_update_metadata,
      ...args_for_update,
    });

    let result = await tx.sendAndConfirm(umi);
    console.log(
      `https://explorer.solana.com/tx/${base58.encode(result.signature)}
      )}?cluster=devnet`,
    );
  } catch (e) {
    console.error(`Oops, something went wrong: ${e}`);
  }
})();
