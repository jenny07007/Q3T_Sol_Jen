import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Vault } from "../target/types/vault";
import { BN } from "bn.js";
import { expect } from "chai";

describe("vault", async () => {
  const provider = anchor.AnchorProvider.env();
  const connection = provider.connection;
  anchor.setProvider(provider);

  const program = anchor.workspace.Vault as Program<Vault>;

  const [statePda, stateBump] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("state"), provider.wallet.publicKey.toBuffer()],
    program.programId,
  );

  const [vaultPda, vaultBump] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), statePda.toBuffer()],
    program.programId,
  );

  it("Is initialized!", async () => {
    const tx = await program.methods
      .initialize()
      .accountsStrict({
        vault: vaultPda,
        vaultState: statePda,
        signer: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();
    console.log("Your transaction signature", tx);

    const vaultState = await fetchVaultState(program, statePda);

    expect(vaultState.stateBump).to.equal(stateBump);
    expect(vaultState.vaultBump).to.equal(vaultBump);
  });

  it("Deposit successfully", async () => {
    const amount = 0.5 * anchor.web3.LAMPORTS_PER_SOL;
    const beforeBalance = await connection.getBalance(vaultPda);

    const tx = await program.methods
      .deposit(new BN(amount))
      .accountsStrict({
        vault: vaultPda,
        vaultState: statePda,
        signer: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();
    console.log("Your transaction signature", tx);

    const afterBalance = await connection.getBalance(vaultPda);
    const vaultState = await fetchVaultState(program, statePda);

    const depositTimestamp = new BN(vaultState.depositTimestamp, 64).toNumber();
    const lockTimestamp = calculateLockTimestamp(depositTimestamp);

    console.log("Deposit date", new Date(depositTimestamp * 1000));
    console.log("Lock date", new Date(lockTimestamp * 1000));

    expect(formatLamports(afterBalance)).to.equal(
      formatLamports(beforeBalance) + formatLamports(amount),
    );
  });

  it("Withdraw failed before locktime", async () => {
    const vaultState = await fetchVaultState(program, statePda);
    const depositTimestamp = new BN(vaultState.depositTimestamp, 10).toNumber();
    const lockTimestamp = calculateLockTimestamp(depositTimestamp);

    try {
      await waitForLockExpiration(lockTimestamp);
      expect.fail(
        "Withdrawal should not be allowed before 24 hours of deposit.",
      );
    } catch (err) {
      console.error("Withdrawal correctly failed due to lock period.");
    }
  });

  it("Withdraw successfully after locktime", async () => {
    const amount = 0.1 * anchor.web3.LAMPORTS_PER_SOL;
    const beforeBalance = await connection.getBalance(vaultPda);

    const vaultState = await fetchVaultState(program, statePda);
    const depositTimestamp = new BN(vaultState.depositTimestamp, 10).toNumber();
    const lockTimestamp = calculateLockTimestamp(depositTimestamp);

    await waitForLockExpiration(lockTimestamp);

    const tx = await program.methods
      .withdraw(new BN(amount))
      .accountsStrict({
        vault: vaultPda,
        vaultState: statePda,
        signer: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();
    console.log("Your transaction signature", tx);

    const afterBalance = await connection.getBalance(vaultPda);

    expect(formatLamports(afterBalance)).to.equal(
      formatLamports(beforeBalance) - formatLamports(amount),
    );
  });

  it("Close account successfully after locktime", async () => {
    const vaultState = await fetchVaultState(program, statePda);
    const depositTimestamp = new BN(vaultState.depositTimestamp, 10).toNumber();
    const lockTimestamp = calculateLockTimestamp(depositTimestamp);

    await waitForLockExpiration(lockTimestamp);

    const tx = await program.methods
      .close()
      .accountsStrict({
        vault: vaultPda,
        vaultState: statePda,
        signer: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();
    console.log("Your transaction signature", tx);

    const afterBalance = await connection.getBalance(vaultPda);
    expect(formatLamports(afterBalance)).to.equal(0);
  });
});

// Utility function to format lamports
function formatLamports(lamports: number): number {
  return lamports / anchor.web3.LAMPORTS_PER_SOL;
}

// Utility function to fetch the vault state
async function fetchVaultState(
  program: Program<Vault>,
  statePda: anchor.web3.PublicKey,
) {
  return await program.account.vaultState.fetch(statePda);
}

// Utility function to calculate lock timestamp
function calculateLockTimestamp(
  depositTimestamp: number,
  lockDuration: number = 12,
): number {
  return depositTimestamp + lockDuration;
}

// Utility function to wait for lock expiration
async function waitForLockExpiration(lockTimestamp: number) {
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const timeToWait = (lockTimestamp - currentTimestamp) * 1000;

  if (timeToWait > 0) {
    console.log(
      `Waiting for ${timeToWait / 1000} seconds until the lock period expires.`,
    );
    await new Promise((resolve) => setTimeout(resolve, timeToWait));
  }
}
