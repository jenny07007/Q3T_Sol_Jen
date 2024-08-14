use crate::state::Config;
use crate::{assert_non_zero, errors::AmmError};
use crate::{assert_not_expired, assert_not_locked};
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{
        mint_to, transfer_checked, Mint, MintTo, TokenAccount, TokenInterface, TransferChecked,
    },
};
use constant_product_curve::ConstantProduct;

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    pub mint_x: Box<InterfaceAccount<'info, Mint>>,
    pub mint_y: Box<InterfaceAccount<'info, Mint>>,
    #[account(
			mut,
			seeds = [b"mint_lp", config.key().as_ref()],
			bump = config.lp_bump
		)]
    pub mint_lp: Box<InterfaceAccount<'info, Mint>>,

    #[account(
			mut,
			associated_token::mint = mint_x,
			associated_token::authority = user,
			associated_token::token_program = token_program,
		)]
    pub user_ata_x: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
			mut,
			associated_token::mint = mint_y,
			associated_token::authority = user,
			associated_token::token_program = token_program,
		)]
    pub user_ata_y: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
			init_if_needed,
			payer = user,
			associated_token::mint = mint_lp,
			associated_token::authority = user,
			associated_token::token_program = token_program,
		)]
    pub user_ata_lp: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
			mut,
			associated_token::mint = mint_x,
			associated_token::authority = config,
			associated_token::token_program = token_program,
		)]
    pub vault_x: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
			mut,
			associated_token::mint = mint_y,
			associated_token::authority = user,
			associated_token::token_program = token_program,
		)]
    pub vault_y: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
			has_one = mint_x,
			has_one = mint_y,
			seeds= [b"amm", mint_x.key().as_ref(), mint_y.key().as_ref(), config.seed.to_le_bytes().as_ref()],
			bump
		)]
    pub config: Box<Account<'info, Config>>,

    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

impl<'info> Deposit<'info> {
    pub fn deposit(&self, amount: u64, max_x: u64, max_y: u64, expiration: i64) -> Result<()> {
        assert_non_zero!([amount, max_x, max_y]);
        assert_not_locked!(self.config.locked);
        assert_not_expired!(expiration);

        let (x, y) = match self.mint_lp.supply == 0
            && self.vault_x.amount == 0
            && self.vault_y.amount == 0
        {
            true => (max_x, max_y),
            false => {
                let amounts = ConstantProduct::xy_deposit_amounts_from_l(
                    self.vault_x.amount,
                    self.vault_y.amount,
                    self.mint_lp.supply,
                    amount,
                    6,
                )
                .map_err(AmmError::from)?;
                (amounts.x, amounts.y)
            }
        };

        // Check for slippage
        require!(x <= max_x && y <= max_y, AmmError::SlippageExceeded);
        self.deposit_tokens(x, true)?;
        self.deposit_tokens(y, false)?;
        self.mint_lp_token(amount)
    }

    pub fn deposit_tokens(&self, amount: u64, is_x: bool) -> Result<()> {
        assert_non_zero!([amount]);

        let (from, to, mint) = match is_x {
            true => (
                self.user_ata_x.to_account_info(),
                self.vault_x.to_account_info(),
                self.mint_x.clone(),
            ),
            false => (
                self.user_ata_y.to_account_info(),
                self.vault_y.to_account_info(),
                self.mint_y.clone(),
            ),
        };

        let accounts = TransferChecked {
            from,
            to,
            mint: mint.to_account_info(),
            authority: self.user.to_account_info(),
        };

        let cpi_ctx: CpiContext<TransferChecked> =
            CpiContext::new(self.token_program.to_account_info(), accounts);

        transfer_checked(cpi_ctx, amount, mint.decimals)?;

        Ok(())
    }

    pub fn mint_lp_token(&self, amount: u64) -> Result<()> {
        assert_ne!(amount, 0, "Amount can't be zero");

        let accounts = MintTo {
            mint: self.mint_lp.to_account_info(),
            to: self.user_ata_lp.to_account_info(),
            authority: self.config.to_account_info(), // TODO: check if implementing config.auth later
        };

        let seed = self.config.seed.to_le_bytes();

        let seeds = &[
            b"amm",
            self.mint_x.to_account_info().key.as_ref(),
            self.mint_y.to_account_info().key.as_ref(),
            seed.as_ref(),
            &[self.config.bump],
        ];
        let signer_seeds = &[&seeds[..]];

        let cpi_ctx = CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            accounts,
            signer_seeds,
        );
        mint_to(cpi_ctx, amount)
    }
}
