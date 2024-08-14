use anchor_lang::prelude::*;

mod contexts;
use contexts::*;
mod state;

declare_id!("HPER28Xm16HLnodnbvWuJkvANeyPCWdiTR3Sphu5CbyJ");

#[program]
pub mod amm {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        seed: u64,
        fee: u16,
        amount_x: u64,
        amount_y: u64,
    ) -> Result<()> {
        ctx.accounts
            .init(seed, fee, ctx.bumps.config, ctx.bumps.mint_lp)?;

        ctx.accounts.deposit(amount_x, true)?;
        ctx.accounts.deposit(amount_y, false)?;
        ctx.accounts.mint_lp(amount_x, amount_y)
    }
}
