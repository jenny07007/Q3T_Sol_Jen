import {
  createNft,
  mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  signerIdentity,
  percentAmount,
  generateSigner,
  createNoopSigner,
  publicKey,
  transactionBuilder,
  sol,
} from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  ActionGetResponse,
  ActionPostRequest,
  ActionPostResponse,
  ACTIONS_CORS_HEADERS,
} from "@solana/actions";
import { PublicKey, LAMPORTS_PER_SOL, Keypair } from "@solana/web3.js";
import dev_wallet from "../../../dev-wallet.json";
import { transferSol, mplToolbox } from "@metaplex-foundation/mpl-toolbox";
import { ErrorMessage } from "@/utils/verifyAmount";
import { uploadImageAndCreateMetadata } from "@/utils/uploadImageAndCreateMetadata";

export const GET = async (request: Request) => {
  try {
    const payload: ActionGetResponse = {
      icon: "https://arweave.net/TeEhULF6yZOcxvrLwQDeb0ifa-gDvc1TFArGJP8jFb8",
      description: "GENERUG from Turbin3",
      title: "RUG!!Blink!!",
      label: "Get This!",
      links: {
        actions: [
          {
            href: `${request.url}?amount=1`,
            label: "Get RUG (1 SOL)",
          },
          {
            href: `${request.url}?amount={value}`,
            label: "Buy Now",
            parameters: [
              {
                name: "value",
                label: "Enter a custom SOL amount",
                required: true,
              },
            ],
          },
        ],
      },
    };

    return Response.json(payload, { headers: ACTIONS_CORS_HEADERS });
  } catch (error) {
    console.error(error);
    return ErrorMessage("Internal server error", 500);
  }
};

export const POST = async (request: Request) => {
  try {
    const body: ActionPostRequest = await request.json();
    const buyer = new PublicKey(body.account);
    const url = new URLSearchParams(request.url.split("?")[1]);
    const amount = url.get("amount");

    if (!amount || !/^\d+(\.\d+)?$/.test(amount)) {
      return ErrorMessage(
        "Invalid amount. Please provide a valid number.",
        422,
      );
    }

    const numericAmount = Number(amount);

    if (numericAmount <= 0) {
      return ErrorMessage("Amount must be greater than 0.", 422);
    }

    const keypair = Keypair.fromSecretKey(new Uint8Array(dev_wallet));
    const sellerPublicKey = publicKey(keypair.publicKey.toBase58());

    const umi = createUmi("https://api.devnet.solana.com");

    const mint = generateSigner(umi);
    const signer = createNoopSigner(publicKey(body.account));

    umi.use(signerIdentity(signer));
    umi.use(mplTokenMetadata());
    umi.use(mplToolbox());

    const buyerWallet = await umi.rpc.getBalance(publicKey(body.account));
    const buyerWalletSol = Number(buyerWallet.basisPoints) / LAMPORTS_PER_SOL;
    const buyerWalletSolNumber = parseFloat(buyerWalletSol.toString());

    if (numericAmount > buyerWalletSolNumber) {
      return ErrorMessage("Insufficient funds", 422);
    }

    // update uri if needed
    // const uri = uploadImageAndCreateMetadata();

    // Create a tx builder for creating & mining the NFT
    // Also transfering custom amount of SOL to the seller
    let txBuilder = transactionBuilder()
      .add(
        createNft(umi, {
          mint: mint,
          name: "SuperRUG",
          symbol: "SUPERRUG",
          uri: "https://arweave.net/uGL9FMg1clkfmf9Ms5vTg3Uhe3B8xAPy0CNdBu3J1s0",
          sellerFeeBasisPoints: percentAmount(25),
        }),
      )
      .add(
        transferSol(umi, {
          source: signer,
          destination: sellerPublicKey,
          amount: sol(numericAmount),
        }),
      );

    // Sign and send the tx
    const tx = await txBuilder.buildAndSign(umi);
    console.log(tx.signatures);

    const serializedTx = umi.transactions.serialize(tx);

    const payload: ActionPostResponse = {
      transaction: Buffer.from(serializedTx).toString("base64"),
      message: `Thanks for your purchase! Your NFT will be minted shortly.`,
    };

    return Response.json(payload, { headers: ACTIONS_CORS_HEADERS });
  } catch (error) {
    console.log("Error:", error);
    return ErrorMessage("Internal server error", 500);
  }
};

// Handle OPTIONS requests for CORS preflight
export const OPTIONS = async () => {
  return Response.json(null, { headers: ACTIONS_CORS_HEADERS });
};
