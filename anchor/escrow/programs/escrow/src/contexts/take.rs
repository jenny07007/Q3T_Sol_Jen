use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{
        close_account, transfer_checked, CloseAccount, Mint, TokenAccount, TokenInterface,
        TransferChecked,
    },
};

use crate::Escrow;

#[derive(Accounts)]
pub struct Take<'info> {
    #[account(mut)]
    pub taker: Signer<'info>,

    #[account(mut)]
    pub maker: SystemAccount<'info>,

    #[account(
			mint::token_program = token_program
		)]
    pub mint_a: InterfaceAccount<'info, Mint>,

    #[account(
			mint::token_program = token_program
		)]
    pub mint_b: InterfaceAccount<'info, Mint>,

    #[account(
			init_if_needed, // we dont know if the taker has the mint_a token 
			payer = taker,
			associated_token::mint = mint_a,
			associated_token::authority = taker,
			token::token_program = token_program
		)]
    pub taker_ata_a: InterfaceAccount<'info, TokenAccount>,

    #[account(
			mut,
            // constraint = taker_ata_b.amount >= escrow.receive @ EscrowError::InsufficientFunds
			associated_token::mint = mint_b,
			associated_token::authority = taker,
			token::token_program = token_program
		)]
    pub taker_ata_b: InterfaceAccount<'info, TokenAccount>,

    #[account(
			init_if_needed,  // we dont know if the makeer has the mint_b token 
			payer = taker,
			associated_token::mint = mint_b,
			associated_token::authority = maker,
			token::token_program = token_program
		)]
    pub maker_ata_b: InterfaceAccount<'info, TokenAccount>,

    #[account(
			mut,
			close = taker, 
			has_one = maker,
			has_one = mint_a,
			has_one = mint_b,
			seeds = [b"escrow", maker.key().as_ref(), escrow.seed.to_le_bytes().as_ref()],
			bump = escrow.bump
		)]
    pub escrow: Account<'info, Escrow>,

    #[account(
			mut,
			associated_token::mint = mint_a,
			associated_token::authority = escrow,
			token::token_program = token_program
		)]
    pub vault: InterfaceAccount<'info, TokenAccount>,

    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

impl<'info> Take<'info> {
    pub fn transfer_to_maker(&self) -> Result<()> {
        let cpi_program = self.token_program.to_account_info();
        let accounts = TransferChecked {
            from: self.taker_ata_b.to_account_info(),
            to: self.maker_ata_b.to_account_info(),
            mint: self.mint_b.to_account_info(),
            authority: self.taker.to_account_info(),
        };

        let cpi_ctx = CpiContext::new(cpi_program, accounts);
        transfer_checked(cpi_ctx, self.escrow.receive, self.mint_b.decimals)
    }

    pub fn withdraw_and_close(&self) -> Result<()> {
        let accounts = TransferChecked {
            from: self.vault.to_account_info(),
            to: self.taker_ata_a.to_account_info(),
            mint: self.mint_a.to_account_info(),
            authority: self.escrow.to_account_info(),
        };

        let key = self.maker.to_account_info().key();
        let seed = self.escrow.seed.to_le_bytes();
        let bump = [self.escrow.bump];

        let signer_seeds = &[&[b"escrow", key.as_ref(), seed.as_ref(), &bump][..]];

        let cpi_ctx = CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            accounts,
            signer_seeds,
        );

        transfer_checked(cpi_ctx, self.vault.amount, self.mint_a.decimals)?;

        let accounts = CloseAccount {
            account: self.vault.to_account_info(),
            destination: self.taker.to_account_info(),
            authority: self.escrow.to_account_info(),
        };

        let cpi_ctx = CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            accounts,
            signer_seeds,
        );

        close_account(cpi_ctx)
    }
}
