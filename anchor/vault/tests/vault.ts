import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Vault } from "../target/types/vault";
import { expect } from "chai";
import { BN } from "bn.js";

describe("vault", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Vault as Program<Vault>;

  const [state_pda, state_bump] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("state"), provider.wallet.publicKey.toBuffer()],
    program.programId,
  );

  const [vault_pda, vault_bump] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), state_pda.toBuffer()],
    program.programId,
  );

  it("Is initialized!", async () => {
    const tx = await program.methods
      .initialize()
      .accountsStrict({
        signer: provider.wallet.publicKey,
        state: state_pda,
        vault: vault_pda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();
    console.log("Your transaction signature", tx);

    const state = await program.account.vaultState.fetch(state_pda);
    expect(state.stateBump).to.equal(state_bump);
    expect(state.vaultBump).to.equal(vault_bump);
  });

  it("Deposits!", async () => {
    const amount = 10000 * anchor.web3.LAMPORTS_PER_SOL;
    const tx = await program.methods
      .deposit(new BN(amount))
      .accountsStrict({
        payer: provider.wallet.publicKey,
        state: state_pda,
        vault: vault_pda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();
    console.log("Your transaction signature", tx);

    const balance = await provider.connection.getBalance(vault_pda);
    expect(formatedLamports(balance)).to.equal(formatedLamports(amount));
  });

  it("Withdraws!", async () => {
    const amount = 500 * anchor.web3.LAMPORTS_PER_SOL;
    const before_balance = await provider.connection.getBalance(vault_pda);
    const tx = await program.methods
      .withdraw(new BN(amount))
      .accountsStrict({
        payer: provider.wallet.publicKey,
        state: state_pda,
        vault: vault_pda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();
    console.log("Your transaction signature", tx);

    const after_balance = await provider.connection.getBalance(vault_pda);
    expect(formatedLamports(after_balance)).to.equal(
      formatedLamports(before_balance - amount),
    );
  });

  it("Closes!", async () => {
    const tx = await program.methods
      .close()
      .accountsStrict({
        signer: provider.wallet.publicKey,
        state: state_pda,
        vault: vault_pda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();
    console.log("Your transaction signature", tx);

    const vault_after_balance = await provider.connection.getAccountInfo(
      vault_pda,
    );

    expect(vault_after_balance).to.be.null;
  });
});

function formatedLamports(amount: number) {
  return amount / anchor.web3.LAMPORTS_PER_SOL;
}
