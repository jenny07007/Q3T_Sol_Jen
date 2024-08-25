use anchor_lang::prelude::*;

mod error;
mod instructions;
pub use instructions::*;

declare_id!("B4YAfGL9oY2WUHhwZuxzwgPPW9vH8yggTkevoicPQfPH");

#[program]
pub mod metaplex_core_staking {
    use super::*;

    pub fn stake(ctx: Context<Stake>) -> Result<()> {
        ctx.accounts.stake()
    }

    pub fn unstake(ctx: Context<UnStake>) -> Result<()> {
        ctx.accounts.unstake()
    }
}
