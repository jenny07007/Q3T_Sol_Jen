import { WALLETS, ACCOUNTS } from "../config";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createMetadataAccountV3,
  CreateMetadataAccountV3InstructionAccounts,
  CreateMetadataAccountV3InstructionArgs,
  DataV2Args,
  findMetadataPda,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  createSignerFromKeypair,
  signerIdentity,
  publicKey,
} from "@metaplex-foundation/umi";
import bs58 from "bs58";

// Define our Mint address
const mint = publicKey(ACCOUNTS.MINT);

// Create a UMI connection
const umi = createUmi("https://api.devnet.solana.com");
const keypair = umi.eddsa.createKeypairFromSecretKey(
  new Uint8Array(WALLETS.WBA_WALLET),
);
const signer = createSignerFromKeypair(umi, keypair);
umi.use(signerIdentity(createSignerFromKeypair(umi, keypair)));

(async () => {
  try {
    // Start here
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

    let { signature } = await tx.sendAndConfirm(umi);
    console.log(
      `https://explorer.solana.com/tx/${signature}
      )}?cluster=devnet`,
    );
  } catch (e) {
    console.error(`Oops, something went wrong: ${e}`);
  }
})();
