<!-- markdownlint-disable -->

## States

- `Marketplace`: Stores global configuration for the marketplace, including admin details, fee structure, and related account bumps (such as for rewards and treasury).
- `Listing`: Holds information about each listed item in the marketplace, including the maker's address, the mint account of the listed item, the price, and the bump for PDA derivation.

## Instructions

- `initialize`:
  Sets up the marketplace by initializing key accounts such as the marketplace itself, the rewards mint, and the treasury.

  - Accounts:
    - `admin (signer)`: The admin who controls the marketplace.
    - `marketplace (PDA)`: The marketplace account that stores the global configuration.
    - `rewards_mint (PDA)`: The account for the rewards mint.
    - `treasury (PDA)`: The treasury account for collecting fees.

- `list`:
  Allows a user to list an NFT for sale on the marketplace.

  - `Accounts`:
    - `maker (signer)`: The user listing the NFT.
    - `maker_ata`: The maker's associated token account (ATA) that holds the NFT.
    - `marketplace (PDA)`: The marketplace account.
    - `maker_mint`: The mint account of the NFT.
    - `metadata`: The metadata account associated with the NFT, storing descriptive information.
    - `master_edition`: The master edition account, which manages the editioning and supply of the NFT.
    - `collection_mint`: The mint account of the collection to which the NFT belongs.
    - `vault`: The vault account where the listed NFT is stored.
    - `listing (PDA)`: The listing account holding details about the listed item.
    - `metadata`: The metadata account associated with the NFT, storing descriptive information.

- `delist`:
  Allows a user to unlist their NFT from the marketplace.

  - `Accounts`:
    - `maker (signer)`: The user who listed the NFT.
    - `marketplace (PDA)`: The marketplace account.
    - `vault`: The vault account holding the NFT.
    - `listing` (PDA): The listing account to be closed.
    - `maker_ata`: The maker's associated token account (ATA) where the NFT will be returned.

- `Purchase`:

  - `send_sol`:

    - Calculates the fee amount based on the listing price and marketplace fee.
    - Transfers the main payment (listing price minus fee) from the taker to the maker.
    - Transfers the fee amount from the taker to the treasury.

  - `send_nft`:

    - Transfers the NFT from the vault (where it was held during listing) to the taker's associated token account.

  - `close_listing_account`:

    - Closes the listing account that was holding the NFT and sends any remaining lamports to the maker.

  - `Accounts`:
    - `taker` (signer): The user purchasing the NFT.
    - `maker`: The user selling the NFT.
    - `marketplace` (PDA): The marketplace account.
    - `vault`: The vault account holding the NFT.
    - `listing` (PDA): The listing account for the NFT.
    - `maker_ata`: The maker's associated token account (ATA) where the NFT is stored.
    - `taker_ata`: The taker's associated token account (ATA) where the NFT will be transferred.
    - `treasury` (PDA): The treasury account for collecting the marketplace fee.
    - `rewards` (PDA): The rewards mint account.

## Notes:

### `SystemAccount`

- Type safety and clarity:
  - It explicitly declares that an account is expected to be a basic System Program account. This helps prevent errors where you might accidentally use a different type of account.
- SOL transfers
- Account validation:
  - Anchor automatically checks that accounts marked as `SystemAccount` are owned by the System Program. This saves you from writing manual checks.
- Interacting with external wallets:
  - Often used to represent user wallets that aren't owned by your program.
- Simplicity:
  When you don't need custom data, using SystemAccount is simpler than creating a custom account type.
