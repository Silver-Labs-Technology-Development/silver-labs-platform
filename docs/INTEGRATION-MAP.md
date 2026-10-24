# Integration map

## First working path

```text
BTCS L2 EVM local RPC
  -> @silver-labs/btcs-l2-client (read-only)
  -> local integration smoke test

BTCS L2 EVM local RPC
  -> SilverPay browser read client (schema v1 port)
  -> watch-only reads, bounded history, send preparation
  -> injected EIP-1193 wallet (signing and submission)
```

The machine-readable RPC surface, unsupported methods, and trust boundaries are
recorded in
[`capabilities/v1/l2-capabilities.json`](../capabilities/v1/l2-capabilities.json)
and validated by
[`schemas/v1/l2-capabilities.schema.json`](../schemas/v1/l2-capabilities.schema.json).
The per-product evidence is in
[`APP-CAPABILITY-MATRIX.md`](./APP-CAPABILITY-MATRIX.md). The manifest describes
the committed local RPC at `btcs-l2` revision `6d78262`; uncommitted diagnostics
in a developer working tree are not part of the contract.

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
| Shared BTCS L2 SDK | **WORKING (read-only, local profile)** | Validates schema v1, local chain ID `31337`, and `BTCSL2/` banner; local integration test passed 1/1 against the running node. It does not sign, submit, prove finality, or establish settlement security. |
| L2 capability manifest and schema | **VERIFIED CONTRACT (local profile)** | Schema v1 validates the observed manifest with Ajv 2020-12. Seven schema/semantic tests pass. It records unsupported methods and gaps; it is not a promise that a method will stay unchanged. |
| SilverPay wallet (`SilverPay`) | **WORKING LOCAL PROTOTYPE** | Network identity, watch-only balance, ERC-20 tracking, bounded history, receive display, and send preparation with injected-wallet signing. 70/70 tests passed with the live node and harness key; build and Chrome watch-only smoke passed. Injected-wallet signing remains unverified while the node rejects `pending`. No payments, NFTs, swaps, faucet, or multi-network support. |
| SilverPay service | **WORKING (read-only local integration)** | Uses shared SDK for L2 network/account reads; separate Core L1 reads. `file:` dependency is workspace-only, not a published release. |
| SilverPay Studio page | **PARTIAL, READ-ONLY** | Existing UI displays L1 UTXO and L2 account/network status. Wallet creation/import, signing, sending, recovery, transaction history, and payments are not implemented. It is not the canonical wallet; see [ADR 0002](./decisions/0002-canonical-silverpay-app.md). |
| SilverForge / token tooling | **PARTIAL; local deployment path tested** | 17/17 tests passed with the live node and harness key; a real ERC-20 contract was compiled, deployed, mined, and read back. Studio, asset service and contracts are co-located in BTCS L2. HTTP tests cover profile connection, local fee quotes, ERC-20 and BSNA-FTS1 deployment, logo retrieval, and authorized mint on an ephemeral local chain. This is not a finalized BSNA specification or production-safe wallet/deployment service. |
| Official Website | **IMPLEMENTED STATIC SITE** | Static developer site with verified repository links and status labels; 8/8 tests pass. No backend, RPC access, indexer, or transaction capability. |
| Token logo upload | **PARTIAL** | UI validates image type/size/dimensions; asset service supports local-dev storage and configurable IPFS storage. Local-dev objects are not portable/durable. |
| NFT deployment | **NOT IMPLEMENTED in Studio** | The NFT deployment UI is explicitly disabled; no audited supported contract path is established here. |
| SilvEx DEX / DEX Node / CEX | **PLANNED / scope repositories only** | Separate public scope repositories exist, but no exchange, custody, swap, routing, or matching implementation was found. OpenCEX was not adopted. |
| Silver Scan | **PLANNED / scope repository only** | No local indexer or explorer implementation was found. Studio's bounded local block view is not an explorer. |
| BTCS L1 mining interface | **PARTIAL (Core node only)** | BTCS Core contains mining RPCs including `getmininginfo`, `getnetworkhashps`, `getblocktemplate`, and `submitblock`. This confirms node interfaces, not a Silver Labs mining pool or its monitoring/accounting/payout service. |
| BTCS mining pool | **PLANNED / scope repository only** | No pool service was found. Do not conflate L2 sequencing with L1 mining. |
| POW-S | **PLANNED / scope repository only** | No implementation, supported API, or customer model was found. |
| Solana token tooling | **NOT VERIFIED** | No Solana/SOL deployment path was found in the inspected Studio/asset-service implementation. Keep SOL gas and any separate adapter distinct; do not infer support from EVM profiles. |

## State and transaction boundaries

The client package intentionally has no transaction signing or submission
methods. The L2 dev sequencer is opt-in and its transaction pool is
in-memory. A missing receipt is not proof that a transaction was never
submitted; query transaction state again and account for restart/reorg behavior
in the calling application.

The wallet delegates signing to an injected EIP-1193 wallet. It does not hold
keys. Its read path uses the same-origin `/rpc` proxy because the node sends no
CORS headers. It derives EIP-1559 fees from the latest block's `baseFeePerGas`
because `eth_gasPrice` and `eth_feeHistory` are absent, and it calls
`btcs_dev_mine` only on the local development profile.

Three observed gaps limit the integrated journey:

- `eth_getTransactionCount(address, "pending")` returns `-32602 Invalid params`.
  Browser wallets and ethers v6 commonly use `pending`, so an injected-wallet
  transfer is not yet proven end to end.
- There is no faucet or `btcs_dev_fund`; only the genesis fixture account holds
  BTCS.
- There is no address index. History is a bounded canonical-block scan and is
  not finality.

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
