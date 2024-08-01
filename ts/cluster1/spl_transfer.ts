import {
  Commitment,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
} from "@solana/web3.js";

import { getOrCreateAssociatedTokenAccount, transfer } from "@solana/spl-token";
import { ACCOUNTS, WALLETS } from "../config";

// We're going to import our keypair from the wallet file
const keypair = Keypair.fromSecretKey(new Uint8Array(WALLETS.WBA_WALLET));

//Create a Solana devnet connection
const commitment: Commitment = "confirmed";
const connection = new Connection("https://api.devnet.solana.com", commitment);

// Mint address
const mint = new PublicKey(ACCOUNTS.MINT);

// Recipient address
const to = new PublicKey("5nc8CuE6H6GGnRPeTdBKwUPWajg2cRRPBqZZC1Yty9an");

(async () => {
  try {
    // Get the token account of the fromWallet address, and if it does not exist, create it
    const from_ata = await getOrCreateAssociatedTokenAccount(
      connection,
      keypair,
      mint,
      keypair.publicKey,
    );
    // Get the token account of the toWallet address, and if it does not exist, create it
    const to_ata = await getOrCreateAssociatedTokenAccount(
      connection,
      keypair,
      mint,
      to,
    );
    // Transfer the new token to the "toTokenAccount" we just created
    const txSig = await transfer(
      connection,
      keypair,
      from_ata.address,
      to_ata.address,
      keypair.publicKey,
      9e6,
    );

    console.log(`https://explorer.solana.com/tx/${txSig}?cluster=devnet`);
  } catch (e) {
    console.error(`Oops, something went wrong: ${e}`);
  }
})();
