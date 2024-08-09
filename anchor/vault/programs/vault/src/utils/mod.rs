use crate::errors::MyError;
use anchor_lang::prelude::*;
use anchor_lang::solana_program::sysvar::clock::Clock;

pub fn check_lock_time(deposit_timestamp: u64) -> Result<()> {
    let clock = Clock::get()?;
    let current_timestamp = clock.unix_timestamp as u64;
    // let lock_timestamp = deposit_timestamp + 24 * 60 * 60; // 24 hours
    let lock_timestamp = deposit_timestamp + 10; // 10 seconds

    println!("Current timestamp: {}", current_timestamp);

    if current_timestamp < lock_timestamp {
        return Err(MyError::WithdrawalLocked.into());
    }
    Ok(())
}
