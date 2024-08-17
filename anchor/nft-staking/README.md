<!-- markdownlint-disable -->

# NFT Staking

A simple NFT [staking program](programs/nft-staking/src/lib.rs) for users to stake, unstake, and claim rewards for the staked NFTs.

## States

- `StakeConfig`: stores global configuration for the staking program
- `UsreAccount`: keeps track of user-specific data like points and amount staked
- `StakeAccount`: holds information about each staked NFT

## Instructions

- `initializeConfig`
  - accounts: `admin` (signer), `config` (PDA), `rewards_mint` (PDA)
  - programs: token program, system program
- `initializeUser`
  - account: `user` (signer), `user_account`
  - programs: token program, system program
- `stake`

  - Uses `Approve` CPI to delegate the user's nft to the stake account(a pda).
  - Freezes the NFT using the `FreezeDelegatedAccountCpi` to prevent transfers while staked.
  - accounts: `user`, `mint`(the mint account of the NFT), `collection` (the collection the NFT belongs to), `mint_ata` (the user's ata holds the NFT), `config`, `state_account`, `user_account`
  - Each NFT has:
    - One Mint account (the NFT itself)
    - One Metadata account (information about the NFT)
    - One Master Edition account (controls supply and editions)
  - Multiple NFTs can belong to:
    - One Collection (represented by the Collection Mint account, can be optional)

- `unstake`

  - Users can unstake the NFT after a specified freeze period
  - Unstaking thaws the NFT using the `ThawDelegatedAccountCpi` and revokes the delegation
  - Points are calculated and add to user's account

- `claim`
  - Users can claim rewards based on their points
  - accounts: `user`, `user_account`, `rewards_mint` (PDA), `rewards_ata` , and `config`

### Master Edition and Collection in the Metaplex protocol

- [Master Edition](https://developers.metaplex.com/core/plugins/master-edition)
  - unique
  - can mint limited or unlimited editions derived from the master edition
  - contorl over supply
- [Collection](https://developers.metaplex.com/core/collections)
  - a group of related NFTs
  - collectins can have shared attributes across all member NFTs
