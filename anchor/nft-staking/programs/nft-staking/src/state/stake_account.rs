use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct StakeAccount {
    pub owner: Pubkey,
    pub mint: Pubkey,     // identify which nft is being staked
    pub last_update: i64, // unix timestamp
    pub bump: u8,
}
