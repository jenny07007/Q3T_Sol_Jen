import * as anchor from "@coral-xyz/anchor";
import {
  createNft,
  findMasterEditionPda,
  findMetadataPda,
  mplTokenMetadata,
  verifyCollection,
  verifySizedCollectionItem,
  MPL_TOKEN_METADATA_PROGRAM_ID,
} from "@metaplex-foundation/mpl-token-metadata";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  KeypairSigner,
  PublicKey,
  createSignerFromKeypair,
  generateSigner,
  keypairIdentity,
  percentAmount,
} from "@metaplex-foundation/umi";
import { Program } from "@coral-xyz/anchor";
import { NftStaking } from "../target/types/nft_staking";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createMint,
  getAssociatedTokenAddressSync,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { SYSTEM_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/native/system";

describe("nft-staking", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.NftStaking as Program<NftStaking>;
  const umi = createUmi(provider.connection);
  const payer = provider.wallet as NodeWallet;

  let nftMint: KeypairSigner;
  let collectionMint: KeypairSigner;

  let stakeAccount: anchor.web3.PublicKey;

  const creatorWallet = umi.eddsa.createKeypairFromSecretKey(
    new Uint8Array(payer.payer.secretKey),
  );
  const creator = createSignerFromKeypair(umi, creatorWallet);
  umi.use(keypairIdentity(creator));
  umi.use(mplTokenMetadata());

  const config = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId,
  )[0];

  const rewardsMint = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("rewards_mint"), config.toBuffer()],
    program.programId,
  )[0];

  const userAccount = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("user"), provider.publicKey.toBuffer()],
    program.programId,
  )[0];

  it("Mint Collection NFT", async () => {
    collectionMint = generateSigner(umi);

    await createNft(umi, {
      mint: collectionMint,
      name: "HELLO",
      symbol: "HEO",
      uri: "https://arweave.net/HELLO",
      sellerFeeBasisPoints: percentAmount(5),
      creators: null,
      collectionDetails: {
        __kind: "V1",
        size: 10,
      },
    }).sendAndConfirm(umi);

    console.log(`Collection NFT Mint: ${collectionMint.publicKey.toString()}`);
  });

  it("Mint NFT", async () => {
    nftMint = generateSigner(umi);

    await createNft(umi, {
      mint: nftMint,
      name: "HELLO",
      symbol: "HEO",
      uri: "https://arweave.net/HELLO",
      sellerFeeBasisPoints: percentAmount(5),
      creators: null,
      collection: { verified: false, key: collectionMint.publicKey },
    }).sendAndConfirm(umi);
    console.log(`Created NFT: ${nftMint.publicKey.toString()}`);
  });

  it("Verify Collection NFT", async () => {
    const collectionMetadata = findMetadataPda(umi, {
      mint: collectionMint.publicKey,
    });

    const collectionMasterEdition = findMasterEditionPda(umi, {
      mint: collectionMint.publicKey,
    });

    const nftMetadata = findMetadataPda(umi, {
      mint: nftMint.publicKey,
    });

    await verifySizedCollectionItem(umi, {
      metadata: nftMetadata,
      collectionMint: collectionMint.publicKey,
      collectionAuthority: creator,
      collection: collectionMetadata,
      collectionMasterEditionAccount: collectionMasterEdition,
    }).sendAndConfirm(umi);

    console.log("Collection Verified");
  });

  it("Initialize Config Account", async () => {
    const tx = await program.methods
      .initializeConfig(10, 10, 0)
      .accountsStrict({
        admin: provider.publicKey,
        config,
        rewardsMint,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    console.log("Config Account Initialized");
    console.log("Transaction Sig: ", tx);
  });

  it("Initialize User Account", async () => {
    const tx = await program.methods
      .initializeUser()
      .accountsPartial({
        user: provider.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    console.log("User Account Initialized");
    console.log("Transaction Sig: ", tx);
  });

  it("Stake NFT", async () => {
    const mintAta = getAssociatedTokenAddressSync(
      new anchor.web3.PublicKey(nftMint.publicKey),
      provider.publicKey,
    );

    const nftMetadata = findMetadataPda(umi, {
      mint: nftMint.publicKey,
    });
    const nftEdition = findMasterEditionPda(umi, {
      mint: nftMint.publicKey,
    });

    stakeAccount = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("stake"),
        new anchor.web3.PublicKey(nftMint.publicKey).toBuffer(),
        config.toBuffer(),
      ],
      program.programId,
    )[0];

    const tx = await program.methods
      .stake()
      .accountsPartial({
        user: provider.publicKey,
        mint: nftMint.publicKey,
        collection: collectionMint.publicKey,
        metadata: new anchor.web3.PublicKey(nftMetadata[0]),
        edition: new anchor.web3.PublicKey(nftEdition[0]),
        config,
        stakeAccount,
        userAccount,
        mintAta,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    console.log("NFT Staked");
    console.log("Transaction Sig: ", tx);
    let account = await program.account.userAccount.fetch(userAccount);
    console.log("amount staked: ", account.amountStaked);
  });

  it("Unstake NFT", async () => {
    const mintAta = getAssociatedTokenAddressSync(
      new anchor.web3.PublicKey(nftMint.publicKey),
      provider.publicKey,
    );

    const nftMetadata = findMetadataPda(umi, { mint: nftMint.publicKey });
    const nftEdition = findMasterEditionPda(umi, { mint: nftMint.publicKey });

    const tx = await program.methods
      .unstake()
      .accountsPartial({
        user: provider.wallet.publicKey,
        mint: nftMint.publicKey,
        collection: collectionMint.publicKey,
        metadata: new anchor.web3.PublicKey(nftMetadata[0]),
        edition: new anchor.web3.PublicKey(nftEdition[0]),
        config,
        stakeAccount,
        userAccount,
        mintAta,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();
    console.log("NFT Unstaked");
    console.log("Transaction Sig: ", tx);

    let account = await program.account.userAccount.fetch(userAccount);
    console.log("amount staked: ", account.amountStaked);
  });

  it("Claim Rewards", async () => {
    const rewardsAta = getAssociatedTokenAddressSync(
      rewardsMint,
      provider.wallet.publicKey,
    );
    const tx = await program.methods
      .claim()
      .accountsPartial({
        user: provider.wallet.publicKey,
        userAccount,
        rewardsMint,
        config,
        rewardsAta,
        systemProgram: SYSTEM_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .rpc();

    console.log("Rewards Claimed");
    console.log("Transaction Sig: ", tx);

    let account = await program.account.userAccount.fetch(userAccount);
    console.log("user points: ", account.points);
  });
});
