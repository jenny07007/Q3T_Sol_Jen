use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenInterface};

use crate::state::StakeConfig;

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
			init,
			payer = admin,
			mint::authority = config,  // only the program can create the mint
			mint::decimals = 6,
			seeds = [b"rewards_mint", config.key().as_ref()],
			bump
		)]
    pub rewards_mint: InterfaceAccount<'info, Mint>,

    #[account(
			init,
			payer = admin,
			space = 8 + StakeConfig::INIT_SPACE,
			seeds = [b"config"],
			bump
		)]
    pub config: Account<'info, StakeConfig>,

    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

impl<'info> InitializeConfig<'info> {
    pub fn initialize_config(
        &mut self,
        points_per_stake: u8,
        max_stake: u8,
        freeze_period: u32,
        bumps: &InitializeConfigBumps,
    ) -> Result<()> {
        self.config.set_inner(StakeConfig {
            points_per_stake,
            max_stake,
            freeze_period,
            reward_bump: bumps.rewards_mint,
            bump: bumps.config,
        });

        Ok(())
    }
}
