use crate::error_code;

#[error_code]
pub enum MyError {
    #[msg("Withdrawal only available after 10 seconds of deposit.")]
    WithdrawalLocked,
}
