use anchor_lang::prelude::*;

use mpl_core::{
    accounts::{BaseAssetV1, BaseCollectionV1},
    fetch_plugin,
    instructions::{RemovePluginV1CpiBuilder, UpdatePluginV1CpiBuilder},
    types::{Attribute, Attributes, FreezeDelegate, Plugin, PluginType, UpdateAuthority},
    ID as CORE_PROGRAM_ID,
};

use crate::error::StakingError;

#[derive(Accounts)]
pub struct UnStake<'info> {
    pub owner: Signer<'info>,
    pub update_authority: Signer<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        mut,
        has_one = owner,
        constraint = asset.update_authority == UpdateAuthority::Collection(collection.key()),
    )]
    pub asset: Account<'info, BaseAssetV1>,
    #[account(
        mut,
        has_one = update_authority
    )]
    pub collection: Account<'info, BaseCollectionV1>,
    #[account(address = CORE_PROGRAM_ID)]
    /// CHECK: this will be checked by core
    pub core_program: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

impl<'info> UnStake<'info> {
    pub fn unstake(&mut self) -> Result<()> {
        // Check if the asset has the attribute plugin already on

        match fetch_plugin::<BaseAssetV1, Attributes>(
            &self.asset.to_account_info(),
            mpl_core::types::PluginType::Attributes,
        ) {
            Ok((_, fetched_attribute_list, _)) => {
                let mut attribute_list: Vec<Attribute> = vec![];
                let mut is_initialized: bool = false;
                let mut staked_time: i64 = 0;

                for attribute in fetched_attribute_list.attribute_list {
                    if attribute.key == "staked" {
                        require!(attribute.value != "0", StakingError::NotStaked);

                        attribute_list.push(Attribute {
                            key: "staked".to_string(),
                            value: 0.to_string(),
                        });

                        staked_time = staked_time
                            .checked_add(Clock::get()?.unix_timestamp as i64)
                            .ok_or(StakingError::Overflow)?
                            .checked_sub(attribute.value.parse::<i64>().unwrap())
                            .ok_or(StakingError::Underflow)?;

                        is_initialized = true;
                    } else if attribute.key == "staked_time" {
                        staked_time = staked_time
                            .checked_add(
                                attribute
                                    .value
                                    .parse::<i64>()
                                    .map_err(|_| StakingError::InvalidTimestamp)?,
                            )
                            .ok_or(StakingError::Overflow)?;
                    } else {
                        attribute_list.push(attribute);
                    }
                }

                attribute_list.push(Attribute {
                    key: "staked_time".to_string(),
                    value: staked_time.to_string(),
                });

                require!(is_initialized, StakingError::StakingNotInitialized);

                UpdatePluginV1CpiBuilder::new(&self.core_program.to_account_info())
                    .asset(&self.asset.to_account_info())
                    .collection(Some(&self.collection.to_account_info()))
                    .payer(&self.payer.to_account_info())
                    .authority(Some(&self.update_authority.to_account_info()))
                    .system_program(&self.system_program.to_account_info())
                    .plugin(Plugin::Attributes(Attributes { attribute_list }))
                    .invoke()?;
            }

            Err(_) => {
                return Err(StakingError::AttributesNotInitialized.into());
            }
        }

        // Unfreeze the asset
        UpdatePluginV1CpiBuilder::new(&self.core_program.to_account_info())
            .asset(&self.asset.to_account_info())
            .collection(Some(&self.collection.to_account_info()))
            .payer(&self.payer.to_account_info())
            .authority(Some(&self.update_authority.to_account_info()))
            .system_program(&self.system_program.to_account_info())
            .plugin(Plugin::FreezeDelegate(FreezeDelegate { frozen: false }))
            .invoke()?;

        // Remove the FreezeDelegate Plugin
        RemovePluginV1CpiBuilder::new(&self.core_program)
            .asset(&self.asset.to_account_info())
            .collection(Some(&self.collection.to_account_info()))
            .payer(&self.payer)
            .authority(Some(&self.owner))
            .system_program(&self.system_program)
            .plugin_type(PluginType::FreezeDelegate)
            .invoke()?;

        Ok(())
    }
}
