use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct VaultState {
    pub state_bump: u8,
    pub vault_bump: u8,
    pub deposit_timestamp: u64,
}
