<!-- markdownlint-disable-->

# Vault Program

The [vault program](programs/vault/src/lib.rs) allows users to create, deposit to, withdraw from, and close a vault account. The vault stores native SOL tokens, and users can perform operations on their vault under certain conditions.

<div align="center">
	<img src="vault.png" width="600">
</div>

## Running Tests

1. Start Localnet: Ensure that a local Solana cluster is running.

```sh
solana-test-validator
```

2. Build the Program: Compile the Solana program.

```sh
anchor build
```

3. Deploy to Localnet: Deploy the program to the local network.

```sh
anchor deploy
```

4. Run Tests: Execute the tests using Anchor.

```sh
anchor test
```
