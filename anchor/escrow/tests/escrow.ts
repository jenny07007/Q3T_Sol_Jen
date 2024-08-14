import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Escrow } from "../target/types/escrow";
import { SystemProgram } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  createMint,
  mintTo,
  getAccount,
  getAssociatedTokenAddress,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";
import BN from "bn.js";
import { assert, expect } from "chai";
import { randomBytes } from "crypto";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";

describe("escrow", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Escrow as Program<Escrow>;
  const wallet = provider.wallet as NodeWallet;

  let mint_a: anchor.web3.PublicKey;
  let mint_b: anchor.web3.PublicKey;
  let maker_ata_a: anchor.web3.PublicKey;
  let maker_ata_b: anchor.web3.PublicKey;
  let taker_ata_a: anchor.web3.PublicKey;
  let taker_ata_b: anchor.web3.PublicKey;
  let escrow_account: anchor.web3.PublicKey;
  let vault_account: anchor.web3.PublicKey;
  let maker: anchor.web3.Keypair;
  let taker: anchor.web3.Keypair;

  const maker_deposit_to_vault = new BN(50);
  const maker_expect_to_receive = new BN(100);
  const seed = new anchor.BN(randomBytes(8));

  before(async () => {
    // Generate keypairs and airdrop SOL
    [maker, taker] = [
      anchor.web3.Keypair.generate(),
      anchor.web3.Keypair.generate(),
    ];
    const airdropAmount = 10 * anchor.web3.LAMPORTS_PER_SOL;

    await Promise.all(
      [maker, taker].map(async (keypair) => {
        const { blockhash, lastValidBlockHeight } =
          await provider.connection.getLatestBlockhash();
        const signature = await provider.connection.requestAirdrop(
          keypair.publicKey,
          airdropAmount,
        );
        await provider.connection.confirmTransaction({
          signature,
          blockhash,
          lastValidBlockHeight,
        });
      }),
    );

    console.log(
      "Balances:",
      "Taker:",
      await provider.connection.getBalance(taker.publicKey),
      "Maker:",
      await provider.connection.getBalance(maker.publicKey),
    );

    // Create mints
    [mint_a, mint_b] = await Promise.all([
      createMint(
        provider.connection,
        wallet.payer,
        provider.publicKey,
        provider.publicKey,
        6,
      ),
      createMint(
        provider.connection,
        wallet.payer,
        provider.publicKey,
        provider.publicKey,
        6,
      ),
    ]);

    // Helper functions
    const getOrCreateATA = async (
      mint: anchor.web3.PublicKey,
      owner: anchor.web3.PublicKey,
    ) =>
      (
        await getOrCreateAssociatedTokenAccount(
          provider.connection,
          wallet.payer,
          mint,
          owner,
          true,
        )
      ).address;

    const mintTokens = async (
      mint: anchor.web3.PublicKey,
      recipient: anchor.web3.PublicKey,
      amount: number,
    ) =>
      mintTo(
        provider.connection,
        wallet.payer,
        mint,
        recipient,
        wallet.payer,
        amount,
      );

    // Create ATAs and mint tokens
    [maker_ata_a, maker_ata_b, taker_ata_a, taker_ata_b] = await Promise.all([
      getOrCreateATA(mint_a, maker.publicKey),
      getOrCreateATA(mint_b, maker.publicKey),
      getOrCreateATA(mint_a, taker.publicKey),
      getOrCreateATA(mint_b, taker.publicKey),
    ]);

    await Promise.all([
      mintTokens(mint_a, maker_ata_a, 100),
      mintTokens(mint_b, maker_ata_b, 100),
      mintTokens(mint_a, taker_ata_a, 100),
      mintTokens(mint_b, taker_ata_b, 100),
    ]);

    // Log token balances
    const ataNames = [
      "maker_ata_a",
      "maker_ata_b",
      "taker_ata_a",
      "taker_ata_b",
    ];
    await Promise.all(
      [maker_ata_a, maker_ata_b, taker_ata_a, taker_ata_b].map(
        async (ata, index) => {
          const balance = await provider.connection.getTokenAccountBalance(ata);
          console.log(`${ataNames[index]}: ${balance.value.amount}`);
        },
      ),
    );

    // Generate PDAs
    [escrow_account] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("escrow"),
        maker.publicKey.toBuffer(),
        seed.toArrayLike(Buffer, "le", 8),
      ],
      program.programId,
    );

    vault_account = await getAssociatedTokenAddress(
      mint_a,
      escrow_account,
      true,
    );

    console.log("escrow_account", escrow_account.toString());
    console.log("vault_account", vault_account.toString());
  });

  it("Make", async () => {
    // console.log("Accounts:", {
    //   maker: maker.publicKey.toString(),
    //   mintA: mint_a.toString(),
    //   mintB: mint_b.toString(),
    //   makerAtaA: maker_ata_a,
    //   escrow: escrow_account.toString(),
    //   vault: vault_account.toString(),
    // });

    try {
      await program.methods
        .make(seed, maker_deposit_to_vault, maker_expect_to_receive)
        .accountsStrict({
          maker: maker.publicKey,
          mintA: mint_a,
          mintB: mint_b,
          makerAtaA: maker_ata_a,
          escrow: escrow_account,
          vault: vault_account,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([maker])
        .rpc();

      // Verify the escrow state
      const escrowAccount = await program.account.escrow.fetch(escrow_account);

      assert.ok(escrowAccount.maker.equals(maker.publicKey));
      assert.ok(escrowAccount.mintA.equals(mint_a));
      assert.ok(escrowAccount.mintB.equals(mint_b));
      assert.ok(escrowAccount.receive.eq(maker_expect_to_receive));

      // Verify the vault balance
      const vaultInfo = await getAccount(provider.connection, vault_account);
      assert.ok(
        vaultInfo.amount.toString() === maker_deposit_to_vault.toString(),
      );
    } catch (error) {
      console.error("Error in Make test:", error);
      if (error instanceof anchor.web3.SendTransactionError) {
        console.error("Logs:", error.logs);
      }
      throw error;
    }
  });
});
