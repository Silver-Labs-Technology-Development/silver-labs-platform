# Integration map

## First working path

```text
BTCS L2 EVM local RPC
  -> @silver-labs/btcs-l2-client (read-only)
  -> local integration smoke test
```

The current RPC is started from
`~/Silver-Labs/btcs-l2/execution/evm`. It binds to `127.0.0.1`, uses the local
EVM chain ID `31337`, and identifies itself with a `BTCSL2/` client-version
banner. The shared client emits and validates explicit identity schema v1
(`local-development`, `btcs-l2-local`) and verifies both observed RPC values
before normal reads. It reads current block,
account, block, transaction, and receipt data. See the
[client API](../packages/btcs-l2-client/README.md) and
[schema compatibility policy](./NETWORK-IDENTITY-COMPATIBILITY.md).

The first genuine product consumer is the existing SilverPay read-only service
at `btcs-l2/services/silverpay-service`. It imports the SDK through a local
`file:` dependency for this workspace and uses it for network identity and
account reads. Its integration check is
`SILVERPAY_L2_RPC_URL=http://127.0.0.1:18545 npm run test:integration` from the
service directory. This dependency intentionally documents the sibling
workspace layout; it is not a portable released dependency while the platform
remote/package release remains undecided.

## Existing adjacent services

- The SilverPay service under `btcs-l2/services/silverpay-service` is a
  loopback-only, read-only gateway to configured BTCS Core and L2 RPCs. It
  does not sign, send, settle, or independently verify either chain.
- The Studio under `btcs-l2/studio` calls its configured service and RPC
  endpoints. It is not an authoritative data source.
- The asset service and token contracts are under the BTCS L2 checkout. A
  stable standalone SilverForge package/API has not been established in the
  inspected workspace.
- BTCS Core's local RPC remains the configured source for L1 observations in
  the current prototypes; its active-chain view is trusted by those callers.

## Product capability matrix

| Product / boundary | Status | Evidence and limit |
| --- | --- | --- |
| Shared BTCS L2 SDK | **WORKING (read-only, local profile)** | Validates schema v1, local chain ID `31337`, and `BTCSL2/` banner; local integration test exists. It does not sign, submit, prove finality, or establish settlement security. |
| SilverPay service | **WORKING (read-only local integration)** | Uses shared SDK for L2 network/account reads; separate Core L1 reads. `file:` dependency is workspace-only, not a published release. |
| SilverPay Studio | **PARTIAL** | Existing UI displays L1 UTXO and L2 account/network status. Wallet creation/import, signing, sending, recovery, transaction history, and payments are not implemented. |
| SilverForge / token tooling | **PARTIAL; local deployment path tested** | Studio, asset service and contracts are co-located in BTCS L2. HTTP tests cover profile connection, local fee quotes, ERC-20 and BSNA-FTS1 deployment, logo retrieval, and authorized mint on an ephemeral local chain. This is not a finalized BSNA specification or production-safe wallet/deployment service. |
| Token logo upload | **PARTIAL** | UI validates image type/size/dimensions; asset service supports local-dev storage and configurable IPFS storage. Local-dev objects are not portable/durable. |
| NFT deployment | **NOT IMPLEMENTED in Studio** | The NFT deployment UI is explicitly disabled; no audited supported contract path is established here. |
| SilvEx DEX / DEX Node / CEX | **NOT IMPLEMENTED / no checkout found** | No local implementation was found in the inspected Silver Labs workspace. No exchange, custody, or swap capability is verified. OpenCEX was not reviewed or integrated. |
| Silver Scan | **NOT IMPLEMENTED / no checkout found** | No local indexer or explorer implementation was found. |
| BTCS L1 mining interface | **PARTIAL (Core node only)** | BTCS Core contains mining RPCs including `getmininginfo`, `getnetworkhashps`, `getblocktemplate`, and `submitblock`. This confirms node interfaces, not a Silver Labs mining pool or its monitoring/accounting/payout service. |
| BTCS mining pool | **NOT IMPLEMENTED / no checkout found** | No pool service was found. Do not conflate L2 sequencing with L1 mining. |
| POW-S | **NOT IMPLEMENTED / no checkout found** | No implementation or supported API was found. |
| Solana token tooling | **NOT VERIFIED** | No Solana/SOL deployment path was found in the inspected Studio/asset-service implementation. Keep SOL gas and any separate adapter distinct; do not infer support from EVM profiles. |

## State and transaction boundaries

The client package intentionally has no transaction signing or submission
methods. The L2 dev sequencer is opt-in and its transaction pool is
in-memory. A missing receipt is not proof that a transaction was never
submitted; query transaction state again and account for restart/reorg behavior
in the calling application.

## Local Studio configuration and checks

The Studio reads `VITE_ASSET_SERVICE_URL` and `VITE_RPC_URL` at build time,
defaulting to `http://127.0.0.1:3001` and `http://127.0.0.1:8545`.
Configure `VITE_RPC_URL` to the same local BTCS L2 RPC used by the asset
service's `BTCS_L2_RPC_URL`; the asset engine validates the selected profile
before deployment, while the Studio uses its RPC endpoint for chain status and
receipt display. Set the local asset service to enable its development
sequencer explicitly. The asset service currently embeds a fixed development
signing key, so use it only against the isolated local development chain; it
is not an account creation/import or custody implementation.

From `btcs-l2/studio`, run `npm test` and `npm run build`. From
`btcs-l2/services/asset-service`, run `npm run typecheck` and the local-only
integration case with `npx tsx --test tests/httpAssetEngineFts1.test.ts`.
The latter starts its own ephemeral RPC and asset service and cleans up its
temporary data; it does not contact a public chain or use real funds.
