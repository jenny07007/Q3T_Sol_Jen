use anchor_lang::{
    prelude::*,
    system_program::{transfer, Transfer},
};
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{
        close_account, transfer_checked, CloseAccount, Mint, TokenAccount, TokenInterface,
        TransferChecked,
    },
};

use crate::state::{Listing, Marketplace};

#[derive(Accounts)]
pub struct Purchase<'info> {
    #[account(mut)]
    pub taker: Signer<'info>,
    #[account(mut)]
    pub maker: SystemAccount<'info>,
    pub maker_mint: InterfaceAccount<'info, Mint>,

    #[account(
			seeds = [b"marketplace", marketplace.name.as_str().as_bytes()],
			bump = marketplace.bump,
	)]
    pub marketplace: Box<Account<'info, Marketplace>>,

    #[account(
			init_if_needed,
			payer = taker,
			associated_token::mint = maker_mint,
			associated_token::authority = taker,
	)]
    pub taker_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
			mut,
			associated_token::authority = listing,
			associated_token::mint = maker_mint,
	)]
    pub vault: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
			mut,
			seeds = [b"rewards", marketplace.key().as_ref()],
			bump = marketplace.rewards_bump,
			mint::decimals = 6,
			mint::authority = marketplace,
	)]
    pub rewards: Box<InterfaceAccount<'info, Mint>>,

    #[account(
			mut,
			close = maker,
			seeds = [marketplace.key().as_ref(), maker_mint.key().as_ref()],
			bump = listing.bump,
	)]
    pub listing: Box<Account<'info, Listing>>,

    #[account(
			seeds = [b"treasury", marketplace.key().as_ref()],
			bump = marketplace.treasury_bump,
	)]
    pub treasury: SystemAccount<'info>,

    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

impl<'info> Purchase<'info> {
    pub fn send_sol(&mut self) -> Result<()> {
        let accounts = Transfer {
            from: self.taker.to_account_info(),
            to: self.maker.to_account_info(),
        };

        let cpi_ctx = CpiContext::new(self.system_program.to_account_info(), accounts);

        let amount = self
            .listing
            .price
            .checked_mul(self.marketplace.fee as u64)
            .and_then(|x| x.checked_div(10000))
            .unwrap();

        transfer(cpi_ctx, self.listing.price - amount)?;

        let accounts = Transfer {
            from: self.taker_ata.to_account_info(),
            to: self.treasury.to_account_info(),
        };

        let cpi_ctx = CpiContext::new(self.token_program.to_account_info(), accounts);
        transfer(cpi_ctx, amount)
    }

    pub fn send_nft(&mut self) -> Result<()> {
        let seeds = &[
            &self.marketplace.key().to_bytes()[..],
            &self.maker_mint.key().to_bytes()[..],
            &[self.listing.bump],
        ];
        let signer_seeds = &[&seeds[..]];

        let accounts = TransferChecked {
            from: self.vault.to_account_info(),
            to: self.taker_ata.to_account_info(),
            authority: self.listing.to_account_info(),
            mint: self.maker_mint.to_account_info(),
        };

        let cpi_ctx = CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            accounts,
            signer_seeds,
        );

        transfer_checked(cpi_ctx, 1, self.maker_mint.decimals)
    }

    pub fn close_listing_account(&mut self) -> Result<()> {
        let seeds = &[
            &self.marketplace.key().to_bytes()[..],
            &self.maker_mint.key().to_bytes()[..],
            &[self.listing.bump],
        ];
        let signer_seeds = &[&seeds[..]];

        let accounts = CloseAccount {
            account: self.vault.to_account_info(),
            destination: self.maker.to_account_info(),
            authority: self.listing.to_account_info(),
        };

        let cpi_ctx = CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            accounts,
            signer_seeds,
        );

        close_account(cpi_ctx)
    }
}
