# Network identity schema and compatibility

## Version 1 contract

[`schemas/v1/network-identity.schema.json`](../schemas/v1/network-identity.schema.json)
defines only the observed **local-development** identity:

| Field | v1 requirement |
| --- | --- |
| `schemaVersion` | Integer `1` |
| `profileType` | `local-development` |
| `profileId` | `btcs-l2-local` |
| `chainId` | Decimal string `31337` |
| `clientVersion` | Starts with `BTCSL2/` |

Unknown fields are rejected. Chain ID `31337` is local-development-only. No
public/testnet profile, public chain ID, or RPC endpoint is defined by this
contract. The identity is derived from observed RPC fields and SDK profile
metadata; it is not a schema-version negotiation with the remote node, endpoint
authentication, consensus proof, finality proof, or settlement guarantee.

## Compatibility policy

- `@silver-labs/btcs-l2-client` currently supports schema version `1` only.
- `validateNetworkIdentity()` rejects a missing or malformed schema version,
  rejects unknown fields, and throws
  `UnsupportedNetworkIdentitySchemaError` for any unsupported version.
- The SDK accepts only its registered `BTCS_L2_LOCAL` profile. Unsupported
  profile IDs/types fail before any RPC request. Every normal data read first
  verifies the local chain ID and client banner; callers should also invoke
  `verifyNetwork()` during startup to report failures before becoming ready.
- The previous local schema draft had no explicit `schemaVersion` property.
  It was not published and no released consumer compatibility was established.
  It is not accepted as an implicit version. There is no earlier supported
  schema version with a compatibility guarantee.
- Future schema versions must document their migration and supported prior
  versions in this file and add fixtures for both accepted and rejected
  versions before release. A public profile requires a separately reviewed
  profile/schema change; it must not reuse local chain ID `31337`.

The validator and Ajv-based tests use the versioned JSON Schema in the platform
repository. Consumers should import the shared SDK rather than duplicate this
validation or RPC logic. The current SilverPay dependency is a workspace-local
`file:` link, not a published package; see the [repository registry](./REPOSITORY-REGISTRY.md)
and [release gates](./RELEASE-GATES.md).

## Consumer sequence

```js
import {
  BTCS_L2_LOCAL,
  createBtcsL2Client,
} from '@silver-labs/btcs-l2-client'

const l2 = createBtcsL2Client({
  endpoint: 'http://127.0.0.1:8545',
  profile: BTCS_L2_LOCAL,
})

const identity = await l2.verifyNetwork()
if (identity.schemaVersion !== 1) {
  throw new Error(`Unsupported network identity schema ${identity.schemaVersion}`)
}
const height = await l2.getBlockNumber()
```

`verifyNetwork()` returns a local identity object only after chain ID and
`BTCSL2/` banner checks. Other read methods enforce this check before their
first data request as well. Calls are read-only; the client has no signing,
transaction-submission, or generic RPC method.
