use crate::state::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
			init,
			payer = signer,
			space = 8 + VaultState::INIT_SPACE,
			seeds = [b"state", signer.key().as_ref()],
			bump,
		)]
    pub state: Account<'info, VaultState>,
    #[account(
			seeds = [b"vault", state.key().as_ref()],
			bump
		)]
    pub vault: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

impl<'info> Initialize<'info> {
    pub fn initialize(&mut self, bumps: &InitializeBumps) -> Result<()> {
        self.state.state_bump = bumps.state;
        self.state.vault_bump = bumps.vault;

        Ok(())
    }
}
