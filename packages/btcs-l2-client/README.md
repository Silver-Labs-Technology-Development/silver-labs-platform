# `@silver-labs/btcs-l2-client`

Version `0.1.0` is a small, read-only client for the current BTCS L2 local
JSON-RPC implementation. It has no runtime dependencies; Ajv and TypeScript
are development dependencies used to validate the JSON Schema and public
declarations. It has no transaction signing, private-key,
transaction-submission, or generic RPC methods.

## Explicit local network profile

```js
import {
  BTCS_L2_LOCAL,
  createBtcsL2Client,
} from './src/index.js'

const client = createBtcsL2Client({
  endpoint: 'http://127.0.0.1:8545',
  profile: BTCS_L2_LOCAL,
})

const identity = await client.verifyNetwork()
const height = await client.getBlockNumber()
const balance = await client.getBalance('0x0000000000000000000000000000000000000000')
```

`verifyNetwork()` returns schema version `1`, profile type
`local-development`, profile ID `btcs-l2-local`, decimal chain ID, and observed
client version. Every ordinary read verifies this identity before the first
data request; successful verification is cached for that client instance.
Consumers should still call and require `verifyNetwork()` explicitly during
startup so failures can be reported before the application becomes ready.

The client accepts only the registered `BTCS_L2_LOCAL` profile. It rejects
custom/public profiles before making any RPC request. The local identity
schema requires chain ID `31337` and a `BTCSL2/` client banner; the local
profile also refuses non-loopback endpoints. These observations reduce
accidental endpoint confusion but are not cryptographic authentication. Do not
use this profile for production or infer consensus/finality. No public/testnet
profile or public chain ID is defined.

## Network identity schema compatibility

The canonical contract is
[`schemas/v1/network-identity.schema.json`](../../schemas/v1/network-identity.schema.json).
Schema v1 is explicitly local-development-only and requires the numeric
`schemaVersion: 1`, `profileType: "local-development"`, `profileId:
"btcs-l2-local"`, chain ID `"31337"`, and a `BTCSL2/` client version. Unknown
fields and profiles are rejected. `validateNetworkIdentity()` accepts only
this version; unsupported versions raise
`UnsupportedNetworkIdentitySchemaError`, and missing or malformed fields
raise `NetworkIdentityValidationError`.

The previous contract file had no explicit `schemaVersion`, and no published
version or consumer depended on that unversioned shape. There is no earlier
schema version with a compatibility guarantee. Consumers must use explicit
schema v1; a future version must document migration and supported prior
versions before release. Schema v1 does not define public-network identities.

## API and data behavior

- `verifyNetwork()` returns the versioned profile ID, decimal chain ID, and
  observed client version.
- `getBlockNumber()`, `getBlock(reference, fullTransactions)`,
  `getBalance(address, reference)`, and `getTransactionCount(address,
  reference)` provide canonical local reads.
- `getNetworkVersion()`, `isListening()`, and `getCode(address, reference)`
  expose the corresponding implemented local RPC reads.
- `getTransaction(hash)` returns a pending transaction when the opt-in
  development sequencer exposes it, a canonical transaction, or `null` if
  unknown to the RPC.
- `getTransactionReceipt(hash)` returns a canonical receipt or `null` when no
  receipt is available.
- `getTransactionStatus(hash)` classifies receipt status as `confirmed` or
  `reverted`; absent receipt plus a pending transaction is `pending`; both
  absent is `missing`. If the RPC returns a block-associated transaction
  without a receipt, the client raises a protocol error rather than guessing.
  `confirmed` means the local RPC currently returns a canonical receipt; it
  does not mean consensus finality or L1 settlement.
- The current RPC response reports `removed: false` for logs and does not
  expose reorganization history. This client cannot report whether a previously
  observed result was affected by a reorganization; consumers must refresh
  canonical data and implement their own reorg handling.

The local RPC's `net_listening` currently returns `false` because it does not
run a peer listener. This does not mean the HTTP RPC server is unavailable.

Only `latest`, `earliest`, and non-negative bigint block numbers are accepted
as block references, matching the supported local RPC contract. Quantities are
returned as `bigint` to avoid precision loss.

Transport errors, JSON-RPC errors, malformed responses, unsupported identity
schemas/profiles, and network mismatch are distinct exported error classes.
Calls have a configurable finite timeout (default 5 seconds; maximum 120
seconds). Endpoint credentials embedded in the URL are rejected.

## Current supported RPC surface used

This client calls only methods present in `btcs-l2/execution/evm/src/rpc.ts`:
`web3_clientVersion`, `eth_chainId`, `eth_blockNumber`,
`eth_getBlockByNumber`, `eth_getTransactionByHash`,
`eth_getTransactionReceipt`, `eth_getBalance`, and
`eth_getTransactionCount`, `eth_getCode`, `net_version`, and
`net_listening`. The local RPC requires loopback access. Use the BTCS L2 repo's
current RPC documentation for server behavior and limitations.

## Tests and integration

```sh
npm test
npm run check:types
BTCS_L2_RPC_URL=http://127.0.0.1:8545 npm run test:integration
```

Unit tests validate the actual JSON Schema and exercise runtime schema/profile
compatibility. They use an isolated mock HTTP server. The integration test is
explicitly run against a real local BTCS L2 endpoint and is skipped when the
environment variable is absent. The package has not been published; consuming
projects must not represent the workspace-local `file:` dependency as a
published release. Pin an approved Git/package release only after a reviewed
release process and registry publication are established.
