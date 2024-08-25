<!-- markdownlint-disable -->

# Whtat is core?

An uniquely designed, single-account non-fungible diggital assets standard.

## AssetV1

- [Asset](https://developers.metaplex.com/core/what-is-an-asset)

```rs
pub struct AssetV1 {
    /// The account discriminator.
    pub key: Key, //1
    /// The owner of the asset.
    pub owner: Pubkey, //32
    /// The update authority of the asset.
    pub update_authority: UpdateAuthority, //33
    /// The name of the asset.
    pub name: String, //4
    /// The URI of the asset that points to the off-chain data.
    pub uri: String, //4
    /// The sequence number used for indexing with compression.
    pub seq: Option<u64>, //1
}
```

### UpdateAuthority

```rs
pub enum UpdateAuthority {
    /// No update authority, used for immutability.
    None,
    /// A standard address or PDA.
    Address(Pubkey),
    /// Authority delegated to a collection.
    Collection(Pubkey),
}
```

## CollectionV1 Asset

A group of assets that belong together, part of the same series, or group.

- [core-collections](https://developers.metaplex.com/core/collections)

```rs
pub struct CollectionV1 {
    /// The account discriminator.
    pub key: Key, //1
    /// The update authority of the collection.
    pub update_authority: Pubkey, //32
    /// The name of the collection.
    pub name: String, //4
    /// The URI that links to what data to show for the collection.
    pub uri: String, //4
    /// The number of assets minted in the collection.
    pub num_minted: u32, //4
    /// The number of assets currently in the collection.
    pub current_size: u32, //4
}
```

## Plugins

[plugins](https://developers.metaplex.com/core/plugins)

A plugin is like an on-chain app for the NFT that can either store data or provide additional functionality to the asset. It works like external data stored in the same account.

### Attribute (Authority Managed)

[attribute](https://developers.metaplex.com/core/plugins/attribute)

**Function**
Store on-chain attributes/traints of the Asset or other statistical data which can be read by on-chain programs.

**Arguments**
`AttributeList: Array<key: string, value: string>`

### PermanentFreeze (Owner Managed)

**Function**
The authority of the plugin can freeze the asset disallowing transfer. Making the asset soulbounded.

**Arguments**
`Forzen: bool`

# Staking program example

| Instruction | Attribute Plugin                       | Freeze Delegate Plugin      |
| ----------- | -------------------------------------- | --------------------------- |
| Stake       | - Save current time in the staked key. | - Add the plugin            |
|             | - Do nothing on the staked_time key    | - Freeze the asset in place |
| Unstake     | - Set the staked time to 0             | - Unfreeze the asset        |
|             | - Add time in the staked_time key      | - Remove the plugin         |
