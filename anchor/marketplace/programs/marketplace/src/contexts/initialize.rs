use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenInterface};

use crate::{error::MarketplaceError, state::Marketplace};

#[derive(Accounts)]
#[instruction(name: String)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
		init,
		seeds = [b"marketplace", name.as_str().as_bytes()],
		bump,
		payer = admin,
		space = 8 + Marketplace::INIT_SPACE,
	)]
    pub marketplace: Account<'info, Marketplace>,

    #[account(
			init,
			seeds = [b"rewards_mint", marketplace.key().as_ref()],
			bump,
			payer = admin,
			mint::decimals = 6,
			mint::authority = marketplace
		)]
    pub rewards_mint: InterfaceAccount<'info, Mint>,

    #[account(
			seeds = [b"treasury", marketplace.key().as_ref()],
			bump
		)]
    pub treasury: SystemAccount<'info>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

impl<'info> Initialize<'info> {
    pub fn init(&mut self, name: String, fee: u16, bumps: &InitializeBumps) -> Result<()> {
        require!(
            name.len() > 0 && name.len() <= 32,
            MarketplaceError::NameTooLong
        );

        self.marketplace.set_inner(Marketplace {
            admin: self.admin.key(),
            fee,
            bump: bumps.marketplace,
            rewards_bump: bumps.rewards_mint,
            treasury_bump: bumps.treasury,
            name,
        });
        Ok(())
    }
}
