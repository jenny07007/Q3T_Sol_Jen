use anchor_lang::prelude::*;

#[error_code]
pub enum StakingError {
    #[msg("Invalid owner")]
    OwnerMismatched,
    #[msg("Invalid timestamp")]
    InvalidTimestamp,
    #[msg("Already staked")]
    AlreadyStaked,
    #[msg("Not staked")]
    NotStaked,
    #[msg("Staking not initialized")]
    StakingNotInitialized,
    #[msg("Attributes not initialized")]
    AttributesNotInitialized,

    #[msg("Underflow")]
    Underflow,
    #[msg("Overflow")]
    Overflow,
}
