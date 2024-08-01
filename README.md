<!-- markdownlint-disable -->

# WBA-Turbin3-SOLANA Cohort

- [WBA-Turbin3-SOLANA Cohort](#wba-turbin3-solana-cohort)
    - [TypeScript PreReq](#typescript-prereq)
    - [Rust Registration](#rust-registration)
  - [🕖 Week-0](#-week-0)
    - [Prerequisites](#prerequisites)
    - [Customize Configuration](#customize-configuration)
    - [How to run](#how-to-run)
  - [🕖 Week-1](#-week-1)
    - [🔑 Key Concepts](#-key-concepts)
    - [🚀 Ship](#-ship)

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

## 🕖 Week-1

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
  [View transaction details](https://explorer.solana.com/tx/4eLQXcp8ko9t9pYyC94amWrSj4qgJ1EjnuLJRZCgniJcKxeDTP5phjAKm3GTLZM36bryoSetVQXThmeFuiEtSXiH?cluster=devnet)

- [spl-transfer](ts/cluster1/spl_transfer.ts)
  [View transaction details](https://explorer.solana.com/tx/5GnRX2PcUamgKNxbv9yGVDrJFGsTsPgNPkczdQo2bhtTaogxDZGx7wWAnTRxE7Sif4VuxbcYfFeodB8KHU4brM8u?cluster=devnet)
