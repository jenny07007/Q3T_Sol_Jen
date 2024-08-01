import { Keypair, Connection, Commitment } from "@solana/web3.js";
import { createMint } from "@solana/spl-token";
import { WALLETS } from "../config";

// Import our keypair from the wallet file
const keypair = Keypair.fromSecretKey(new Uint8Array(WALLETS.WBA_WALLET));

//Create a Solana devnet connection
const commitment: Commitment = "confirmed";
const connection = new Connection("https://api.devnet.solana.com", commitment);

(async () => {
  try {
    // create a mint account
    const mint = await createMint(
      connection,
      keypair,
      keypair.publicKey,
      null,
      6,
    );

    console.log(`Your mint address: ${mint.toBase58()}`);
  } catch (error) {
    console.log(`Oops, something went wrong: ${error}`);
  }
})();
