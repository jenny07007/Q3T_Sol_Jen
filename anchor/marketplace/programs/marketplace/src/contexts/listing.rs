use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    metadata::{Metadata, MetadataAccount},
    token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked},
};

use crate::state::{Listing, Marketplace};

#[derive(Accounts)]
pub struct List<'info> {
    #[account(mut)]
    pub maker: Signer<'info>,

    #[account(
        mut,
        seeds = [b"marketplace", marketplace.name.as_str().as_bytes()],
        bump = marketplace.bump,
    )]
    pub marketplace: Box<Account<'info, Marketplace>>,

    pub maker_mint: Box<InterfaceAccount<'info, Mint>>,
    pub collection_mint: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(
        mut,
        associated_token::mint = maker_mint,
        associated_token::authority = maker,
    )   ]
    pub maker_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        init,
        payer = maker,
        space = Listing::INIT_SPACE,
        seeds = [b"listing", marketplace.key().as_ref(), maker_mint.key().as_ref()],
        bump,
    )]
    pub lisitng: Box<Account<'info, Listing>>,

    #[account(
        init_if_needed,
        payer = maker,
        associated_token::authority = lisitng,
        associated_token::mint = maker_mint,
    )]
    pub vault: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        seeds = [b"metadata", metadata_program.key().as_ref(), maker_mint.key().as_ref()],
        seeds::program = metadata_program.key(),
        bump,
    )]
    pub metadata: Box<Account<'info, MetadataAccount>>,

    pub associated_token_program: Program<'info, AssociatedToken>,
    pub metadata_program: Program<'info, Metadata>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

impl<'info> List<'info> {
    pub fn create_listing(&mut self, price: u64, bumps: &ListBumps) -> Result<()> {
        self.lisitng.set_inner(Listing {
            marker: self.maker.key(),
            mint: self.maker_mint.key(),
            price,
            bump: bumps.lisitng,
        });

        Ok(())
    }

    pub fn deposit_nft(&mut self) -> Result<()> {
        let account = TransferChecked {
            from: self.maker_ata.to_account_info(),
            mint: self.maker_mint.to_account_info(),
            to: self.vault.to_account_info(),
            authority: self.maker.to_account_info(),
        };

        let cpi_ctx = CpiContext::new(self.token_program.to_account_info(), account);
        // TIP: look at the mint in the account to get the decimals
        transfer_checked(cpi_ctx, 1, self.maker_mint.decimals)?;

        Ok(())
    }
}
