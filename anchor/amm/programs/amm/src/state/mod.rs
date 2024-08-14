use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Config {
    pub mint_x: Pubkey,
    pub mint_y: Pubkey,
    pub seed: u64,
    pub fee: u16, // base point, 100% -> 100.00
    pub bump: u8,
    pub lp_bump: u8,
    pub locked: bool,
}
