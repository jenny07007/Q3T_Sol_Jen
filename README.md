<!-- markdownlint-disable -->

# WBA-Turbin3-SOLANA Cohort

- [WBA-Turbin3-SOLANA Cohort](#wba-turbin3-solana-cohort)
  - [TypeScript PreReq](#typescript-prereq)
  - [Rust Registration](#rust-registration)
  - [🕖 Week-0](#-week-0)
    - [Prerequisites](#prerequisites)
    - [Customize Configuration](#customize-configuration)
    - [How to run](#how-to-run)
  - [🕖 Week-1-Typescript](#-week-1-typescript)
    - [🔑 Key Concepts](#-key-concepts)
    - [🚀 Ship](#-ship)
  - [🕖 Week-2-Anchor](#-week-2-anchor)
    - [🔑 Key Concepts](#-key-concepts-1)
    - [🚀 Ship](#-ship-1)
  - [🕖 Week-3 NFT Staking](#-week-3-nft-staking)
    - [🔑 Key Concepts](#-key-concepts-2)
    - [🚀 Ship](#-ship-2)

### TypeScript PreReq

1. **Enroll in the WBA program on Devnet using your GitHub handle**:
   - **File**: [ts/prereqs/enroll.ts](./ts/prereqs/enroll.ts)
   - **Description**: This script contains the main logic for interacting with the WBA program on the Solana Devnet using TypeScript.
   - **WBA IDL**: Defined in [ts/programs/wba_prereq.ts](./ts/programs/wba_prereq.ts), which specifies the TypeScript type and object for the WBA Interface Definition Language (IDL).
   - [🚀 View transaction details](https://explorer.solana.com/tx/41bc586YMi1Aw29UW5C6a8bk6KUnPBU8veqzJmQn5mrAatrBt7VRRY6DaiP5qHvvqciTSLVXRStb5NWg8FhgR3j5?cluster=devnet)

### Rust Registration

2. **Enroll in the WBA program on Devnet using your GitHub handle**:
   - **File**: [prereqs.rs](./rs/src/prereqs.rs)
   - **Description**: This script provides the logic to enroll in the WBA program using Rust.
   - [🚀 View transaction details](https://explorer.solana.com/tx/HwCDK3phYRt4piKQiVsqvceMsM3566qFrmtncrM15RwZDCdpTiRg5j6htz2EMemWd2NPz15px7LHyMG4pobErTR?cluster=devnet)

Explore the [WBA Program](https://explorer.solana.com/address/WBA52hW35HZU5R2swG57oehbN2fTr7nNhNDgfjnqUoZ/anchor-program?cluster=devnet).

## 🕖 Week-0

### Prerequisites

Before starting, ensure you have the following:

- **Node.js and Yarn**: These are required for running the scripts.
- **Solana Wallet Keypairs**: You should have two wallet keypairs stored at the following locations:
  - `./cluster1/wallet/dev-wallet.json`
  - `./cluster1/wallet/wba-wallet.json`

### Customize Configuration

Single entrypoint for wallets and accounts:

- **File**: [config/index.ts](ts/config/index.ts)

```js
import { dev_wallet, wba_wallet } from "../cluster1/wallet";

export const ACCOUNTS = {
  MINT: "",
};

export const RPC_ENDPOINT = "https://api.devnet.solana.com";

export const WALLETS = {
  WBA_WALLET: wba_wallet,
  DEV_WALLET: dev_wallet,
};
```

### How to run

1. Install Dependencies

```sh
yarn
```

2. Run the script

```sh
yarn spl_init
```

## 🕖 Week-1-Typescript

### 🔑 Key Concepts

- **Accounts**: Everything on-chain is an account.
- **Programs**: Stateless executable code.
  - **SPL Token Program (Native Program)**: A standard program on Solana for creating fungible/non-fungible tokens.
    - **Mint**: The source of new tokens, responsible for creating them.
    - **Token Accounts**: Hold balances of tokens and are associated with specific mints.
      - **ATA (Associated Token Account)**: Simplifies token management, unique to wallet and mint.
        - **PDA (Program Derived Address)**: A derived account address using a bump, seed, and program ID for deterministic addresses.
- **Transactions**: Use Proof-of-History to order and verify instructions atomically.
- **IDL (Interface Definition Language)**: Defines interfaces for Solana programs, enabling client interactions.
- [Blinks and Actions](https://solana.com/docs/advanced/actions): Use URLs to create and execute Solana transactions from any web platform

### 🚀 Ship

- [spl-init](ts/cluster1/spl_init.ts)
  mint address : H9x1N93bxgcN7jU25matB4FTtRTTXVJdcja8AxCNrHU
  [View transaction details](https://explorer.solana.com/tx/3XtX49ot7bQrgGKMEpxppboAK4b1dQ1BeL7o3GpMv6JiYycnCFX9oMdyWP116rRMeYLgQjgDLuBbKTZgbDStA7uw?cluster=devnet)

- [spl-mint](ts/cluster1/spl_mint.ts)
  ata: 5wVyEksqjFC6kWvkxwkg8SDrdbkYzX2ChmfgMJpMwKmv
  [View transaction details](https://explorer.solana.com/tx/4unWMEyBbcFGRbSTbaRANvafif1nEhxCWhEzzsU2MT5eLorTukrUH2JqCVGtAVrxBVz7f4Z1PKiCjcKb4qy9kePd?cluster=devnet)

- [spl-metadata](ts/cluster1/spl_metadata.ts)

  - Create metadata: [View transaction details](https://explorer.solana.com/tx/4eLQXcp8ko9t9pYyC94amWrSj4qgJ1EjnuLJRZCgniJcKxeDTP5phjAKm3GTLZM36bryoSetVQXThmeFuiEtSXiH?cluster=devnet)
  - Update metadata: [View transaction details](https://explorer.solana.com/tx/QwVyXnUCwfAU8qGuix4ykELVW8nSXC1gQHZCUC55ig2pXxJ4cDWFwt8vCdemzvr6fEZjDdT46yPpVQRpJz6C74K?cluster=devnet)

- [spl-transfer](ts/cluster1/spl_transfer.ts) : [View transaction details](https://explorer.solana.com/tx/5GnRX2PcUamgKNxbv9yGVDrJFGsTsPgNPkczdQo2bhtTaogxDZGx7wWAnTRxE7Sif4VuxbcYfFeodB8KHU4brM8u?cluster=devnet)

- [nft_mint](ts/cluster1/nft_mint.ts) - Mint an RUG NFT using [umi](https://developers.metaplex.com/umi):

  1. Generate image: [nft_image.ts](ts/cluster1/nft_image.ts)
  2. Create metadata: [nft_metadata.ts](ts/cluster1/nft_metadata.ts)
  3. Mint NFT: [View transaction](https://explorer.solana.com/tx/4uLPYrU6cbc48wGiXgE35BwZ7bji2RLx5RPbAM3VAiEJ39RnLoZWjmd4B2ENoB8wEVsY268PVvLKPmSan4ELoxej?cluster=devnet)

- [🦾 Challenge](challenges/rug-blinks/app/api/action/route.ts)
  - [README](challenges/rug-blinks/README.md)

## 🕖 Week-2-Anchor

### 🔑 Key Concepts

- **State**: represents the program's persistent data model, maintaining essential information for the program's operation.
- **Account**: essential elements required for instructions to execute. Each instruction interacts with one or more accounts to perform its operations.
- **PDA Account**:
  - created deterministically using `seeds` and the `program ID`.
  - owned by the program, allowing only the program to modify its state.
  - enables cross-program invocation (CPI), allowing the program to sign transactions on behalf of the account without needing a private key.
- **Instruction** : operations that define the logic for specific actions, such as `initialize()`, `upvote()`, and `downvote()`. They interact with accounts, manage parameters, and modify state securely.
- **Context`<T>` parameters**: encapsulates all accounts and data needed for each instruction, as defined by the corresponding account structs.

### 🚀 Ship

- [vote program](anchor/vote-program/README.md)
- [vault program](anchor/vault/README.md)
- [escrow program](anchor/escrow/README.md)
- [amm](anchor/amm/README.md)

## 🕖 Week-3 NFT Staking

### 🔑 Key Concepts

- **Delegation**: transfers authority over NFTs from the user to the program.
- **FreezeDelegatedAccountCPI**: locks NFTs to prevent transfers while staked.
- **ThawDelegatedAccountCPI**: unlocks NFTs during unstaking.
- **Timestamp**: tracks when the NFT was last staked, used to calculate rewards and enforce freeze periods.

### 🚀 Ship

- [nft_staking](anchor/nft-staking/README.md)
