use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct StakeConfig {
    pub points_per_stake: u8,
    pub max_stake: u8,
    pub freeze_period: u32, // when stake is created, it will be delegated authority to the program account(pda),then freeze the stake for a while
    pub reward_bump: u8,    // make it easier to fetch the pda
    pub bump: u8,
}
