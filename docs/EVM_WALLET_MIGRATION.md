# EVM wallet migration

The canonical application identity is now an internal `Account` authenticated
by an EVM wallet through RainbowKit and WalletConnect. The wallet address is a
linked identity, not the account primary key. The initial settlement chain is
Arbitrum, but the UI does not require a player to understand or manually select
Arbitrum to browse or authenticate.

Authentication uses a one-time, five-minute EIP-4361/SIWE-style challenge. The
challenge binds the domain, URI, EVM address, chain ID, nonce, issue time and
expiry. The backend verifies the ECDSA signature, atomically consumes the
challenge, and issues a short-lived JWT bound to the internal account.

USDC is the canonical ledger display unit. Chain-specific deposit routing,
gas abstraction and bankroll settlement remain provider concerns; WINR is
still behind `BankrollRouter` and remains disabled until its verified operator
transport is supplied.

## Reown project ID

Set the public Reown/WalletConnect project identifier in the frontend runtime
environment:

```dotenv
# frontend/.env.local
NEXT_PUBLIC_WC_PROJECT_ID=your-reown-project-id
```

It is also documented in `frontend/.env.example`. The value is a public browser
configuration identifier, not a private key. Do not put private wallet keys or
provider secrets in this variable.

If it is left empty, the local build intentionally falls back to injected and
Coinbase connectors; production should configure the Reown project ID and its
allowed origins.

Solana is not part of the canonical authentication or betting path. Future
Solana support must implement a separate chain adapter linked to the same
internal account and must not restore the retired custody or wallet-adapter
stack.
