use anchor_lang::prelude::*;

mod contexts;
mod state;
use contexts::*;
use state::*;

declare_id!("G6bJ5Gm9t2u8AWFxKFbwqy3V44REHvmeUZD5CCyPTkpx");

#[program]
pub mod escrow {

    use super::*;

    // put the 'seed' after the ctx will save you an hour of life :)
    pub fn make(ctx: Context<Make>, seed: u64, amount: u64, receive: u64) -> Result<()> {
        // I deposit X to the vault, I expect to receive Y in return
        ctx.accounts.init_escrow(seed, receive, &ctx.bumps)?;
        ctx.accounts.deposit_to_vault(amount)
    }

    pub fn take(ctx: Context<Take>) -> Result<()> {
        // I agree the condiction. I Transfer Y to the maker
        // I withdraw X from the vault and close my account
        ctx.accounts.transfer_to_maker()?;
        ctx.accounts.withdraw_and_close()
    }

    pub fn refund(ctx: Context<Refund>) -> Result<()> {
        // I am happy with the condition. I withdraw X from the vault and close my account
        ctx.accounts.withdraw_and_close()
    }
}
