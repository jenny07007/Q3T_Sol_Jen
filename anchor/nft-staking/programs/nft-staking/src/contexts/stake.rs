use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    metadata::{
        mpl_token_metadata::instructions::{
            FreezeDelegatedAccountCpi, FreezeDelegatedAccountCpiAccounts,
        },
        MasterEditionAccount, Metadata, MetadataAccount,
    },
    token_interface::{approve, Approve, Mint, TokenAccount, TokenInterface},
};

use crate::state::{StakeAccount, StakeConfig, UserAccount};

#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    pub mint: Box<InterfaceAccount<'info, Mint>>,
    pub collection: Box<InterfaceAccount<'info, Mint>>,

    #[account(
        mut,
        associated_token::authority = user,
        associated_token::mint = mint
    )]
    pub mint_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        seeds = [
            b"metadata",
            metadata_program.key().as_ref(),
            mint.key().as_ref()
        ],
        constraint = metadata.collection.as_ref().unwrap().key.as_ref() == collection.key().as_ref(),
        constraint = metadata.collection.as_ref().unwrap().verified == true,
        seeds::program = metadata_program.key(),
        bump,
    )]
    pub metadata: Box<Account<'info, MetadataAccount>>,

    #[account(
        seeds = [
            b"metadata",
            metadata_program.key().as_ref(),
            mint.key().as_ref(),
            b"edition"
        ],
        seeds::program = metadata_program.key(),
        bump
    )]
    pub edition: Box<Account<'info, MasterEditionAccount>>,

    pub config: Box<Account<'info, StakeConfig>>,

    #[account(
        init,
        payer = user,
        space = 8 + StakeAccount::INIT_SPACE,
        seeds = [b"stake", mint.key().as_ref(), config.key().as_ref(),],
        bump
    )]
    pub stake_account: Box<Account<'info, StakeAccount>>,

    #[account(
        mut,
        seeds = [b"user", user.key().as_ref(),],
        bump = user_account.bump
    )]
    pub user_account: Box<Account<'info, UserAccount>>,

    pub metadata_program: Program<'info, Metadata>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

impl<'info> Stake<'info> {
    pub fn stake(&mut self, bumps: &StakeBumps) -> Result<()> {
        // time stamp
        self.stake_account.set_inner(StakeAccount {
            owner: self.user.key(),
            mint: self.mint.key(),
            last_update: Clock::get()?.unix_timestamp,
            bump: bumps.stake_account,
        });

        // where we do the delegation
        let accounts = Approve {
            to: self.mint_ata.to_account_info(),
            delegate: self.stake_account.to_account_info(),
            authority: self.user.to_account_info(),
        };

        let cpi_ctx = CpiContext::new(self.token_program.to_account_info(), accounts);
        approve(cpi_ctx, 1)?;

        let delegate = &self.stake_account.to_account_info();
        let token_account: &AccountInfo<'info> = &self.mint_ata.to_account_info();
        let edition = &self.edition.to_account_info();
        let mint = &self.mint.to_account_info();
        let token_program = &self.token_program.to_account_info();
        let metadata_program = &self.metadata_program.to_account_info();

        let seeds = &[
            b"stake",
            self.mint.to_account_info().key.as_ref(),
            self.config.to_account_info().key.as_ref(),
            &[bumps.stake_account],
        ];
        let signers_seeds = &[&seeds[..]];

        // freeze account
        FreezeDelegatedAccountCpi::new(
            metadata_program,
            FreezeDelegatedAccountCpiAccounts {
                delegate,      // The account that has been delegated authority
                token_account, // The token account holding the NFT, which is the ata
                mint,          // The mint of the NFT
                edition,       // The master edition of the NFT
                token_program,
            },
        )
        .invoke_signed(signers_seeds)?;

        //require!(self.user_account.amount_staked < self.config.max_stake, "Max stake reached");
        self.user_account.amount_staked += 1;

        Ok(())
    }
}
