import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { VoteProgram } from "../target/types/vote_program";
import { expect } from "chai";
import BN from "bn.js";

describe("vote-program", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.VoteProgram as Program<VoteProgram>;
  const url = "https://supercool.sol";

  const voteAccount = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from(url)],
    program.programId,
  )[0];

  it("Is initialized!", async () => {
    const tx = await program.methods
      .initialize(url)
      .accountsPartial({
        payer: provider.wallet.publicKey,
        voteAccount,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();
    console.log("Your transaction signature", tx);

    const vote_state = await program.account.voteState.fetch(voteAccount);
    expect(vote_state.score.eq(new BN(0))).to.be.true;
    expect(vote_state.lastVote).to.equal(null);

    console.log("vote state", vote_state);
  });

  it("upvote", async () => {
    const tx = await program.methods
      .upvote(url)
      .accountsPartial({
        signer: provider.wallet.publicKey,
        voteAccount,
      })
      .rpc();
    console.log("Your transaction signature", tx);

    const vote_state = await program.account.voteState.fetch(voteAccount);

    expect(vote_state.score.eq(new BN(1))).to.be.true;
    expect(vote_state.lastVote.toBase58()).to.equal(
      provider.wallet.publicKey.toBase58(),
    );
  });

  it("downvote", async () => {
    const tx = await program.methods
      .downvote(url)
      .accountsPartial({
        signer: provider.wallet.publicKey,
        voteAccount,
      })
      .rpc();
    console.log("Your transaction signature", tx);

    const vote_state = await program.account.voteState.fetch(voteAccount);
    expect(vote_state.score.eq(new BN(0))).to.be.true;
    expect(vote_state.lastVote.toBase58()).to.equal(
      provider.wallet.publicKey.toBase58(),
    );
  });
});
