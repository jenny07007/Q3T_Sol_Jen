use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{
        mint_to, transfer_checked, Mint, MintTo, TokenAccount, TokenInterface, TransferChecked,
    },
};

use crate::state::Config;

#[derive(Accounts)]
#[instruction(seed: u64)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub maker: Signer<'info>,

    #[account(
			mint::token_program = token_program
		)]
    pub mint_x: Box<InterfaceAccount<'info, Mint>>,

    #[account(
			mint::token_program = token_program
		)]
    pub mint_y: Box<InterfaceAccount<'info, Mint>>,

    #[account(
			init,
			payer = maker,
			mint::authority = config,
			mint::decimals = 6,
			mint::token_program = token_program,
			seeds = [b"mint", config.key().as_ref()],
			bump

		)]
    pub mint_lp: Box<InterfaceAccount<'info, Mint>>,

    #[account(
			init,
			payer = maker,
			associated_token::mint = mint_x,
			associated_token::authority = config,
			associated_token::token_program = token_program
		)]
    pub vault_x: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
			init,
			payer = maker,
			associated_token::mint = mint_y,
			associated_token::authority = config,
			associated_token::token_program = token_program
		)]
    pub vault_y: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
			mut,
			associated_token::mint = mint_x,
			associated_token::authority = maker,
			associated_token::token_program = token_program
		)]
    pub maker_ata_x: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
			mut,
			associated_token::mint = mint_y,
			associated_token::authority = maker,
			associated_token::token_program = token_program
		)]
    pub maker_ata_y: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
			init,
			payer = maker,
			associated_token::mint = mint_lp,
			associated_token::authority = maker,
			associated_token::token_program = token_program
		)]
    pub maker_ata_lp: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
			init,
			payer = maker,
			space = 8 + Config::INIT_SPACE,
			seeds = [b"config", mint_x.key().as_ref(), mint_y.key().as_ref(), seed.to_le_bytes().as_ref()],
			bump
		)]
    pub config: Box<Account<'info, Config>>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

impl<'info> Initialize<'info> {
    pub fn init(&mut self, seed: u64, fee: u16, bump: u8, lp_bump: u8) -> Result<()> {
        self.config.set_inner(Config {
            mint_x: self.mint_x.key(),
            mint_y: self.mint_y.key(),
            bump,
            lp_bump,
            seed,
            fee,
            locked: false,
        });
        Ok(())
    }

    pub fn deposit(&mut self, amount: u64, is_x: bool) -> Result<()> {
        let (from, to, mint) = match is_x {
            true => (
                self.maker_ata_x.to_account_info(),
                self.vault_x.to_account_info(),
                self.mint_x.clone(),
            ),
            false => (
                self.maker_ata_y.to_account_info(),
                self.vault_y.to_account_info(),
                self.mint_y.clone(),
            ),
        };

        let accounts = TransferChecked {
            from,
            mint: mint.to_account_info(),
            to,
            authority: self.maker.to_account_info(),
        };

        let cpi_ctx = CpiContext::new(self.token_program.to_account_info(), accounts);
        transfer_checked(cpi_ctx, amount, mint.decimals)
    }

    pub fn mint_lp(&mut self, amount_x: u64, amount_y: u64) -> Result<()> {
        // calculating the amount of LP tokens to mint
        // based on the product of the two token amounts being deposited (amount_x and amount_y)
        // checked_mul() is used to prevent overflow, Some(amount) is returned if successful, None is returned if overflow occurs
        let amount = amount_x
            .checked_mul(amount_y)
            .ok_or(ProgramError::ArithmeticOverflow)?;

        let accounts = MintTo {
            mint: self.mint_lp.to_account_info(),
            to: self.maker_ata_lp.to_account_info(),
            authority: self.config.to_account_info(),
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
