# Application capability matrix

Observed on 2026-10-23 against the local BTCS L2 development profile:

- RPC: `http://127.0.0.1:18545` (isolated node; the default `8545` was occupied)
- Banner: `BTCSL2/v0.14-local/ethereumjs-vm-10.1.3/osaka`
- Chain ID: `31337` (`0x7a69`)
- Sequencer: `--dev-sequencer` (manual mining, in-memory pool)

This matrix separates **real local evidence** from **unit/mock evidence** and
from **not implemented**. A green test against a local node is not public-network
or production evidence. See
[`capabilities/v1/l2-capabilities.json`](../capabilities/v1/l2-capabilities.json)
for the machine-readable RPC surface and
[`RELEASE-GATES.md`](./RELEASE-GATES.md) for the release boundary.

## Product surfaces

| Surface | Status | Real local evidence | Limits |
| --- | --- | --- | --- |
| `@silver-labs/btcs-l2-client` | **VERIFIED READ-ONLY** | `BTCS_L2_RPC_URL=http://127.0.0.1:18545 npm run test:integration` passed 1/1: identity, canonical block, and account read. | No signing, submission, filters, fee history, address index, or finality. Unpublished `UNLICENSED` source. |
| Capability manifest and schema v1 | **VERIFIED CONTRACT** | 7 schema/semantic tests pass; manifest validates with Ajv 2020-12. | Describes the committed local RPC only. Uncommitted `btcs_nodeInfo` / `btcs_health` diagnostics are deliberately excluded. |
| SilverPay wallet (`SilverPay`) | **WORKING LOCAL PROTOTYPE** | 70/70 tests with the live node and harness key; real native transfer signed outside the app, submitted, mined, and receipted; production build succeeds; Chrome watch-only smoke passed with 0 console errors. | Injected-wallet signing is unverified because the node rejects the `pending` block tag. No payments, NFTs, swaps, faucet, or multi-network support. |
| SilverForge Studio | **WORKING LOCAL PROTOTYPE** | 17/17 tests with the live node and harness key; a real ERC-20 contract was compiled, deployed, mined, and read back. | Token creation only. NFT deployment is disabled. No audited production contract path. |
| SilverPay service (`btcs-l2/services/silverpay-service`) | **READ-ONLY LOCAL** | Uses the platform client for L2 identity/account reads; separate Core L1 reads. | No keys, signing, sending, history, recovery, or payments. Owned by the protocol repository. |
| Studio SilverPay page (`btcs-l2/studio`) | **READ-ONLY PARTIAL** | Displays configured L1/L2 status. | Not a wallet. No signing, recovery, history, or payments. Owned by the protocol repository. |
| Official Website | **STATIC DEVELOPER SITE** | 8/8 static tests pass; no backend or RPC access. | Describes status only. It cannot transact, index, or verify a chain. |
| Silver Scan, SilvEx CEX/DEX/DEX Node, BTCS Mining Pool, POW-S | **PLANNED / SCOPE ONLY** | Scope repositories exist. | No implementation. Do not link them as working products. |

## Capability coverage

| Capability | SilverPay wallet | SilverForge Studio | Platform client | Evidence class |
| --- | --- | --- | --- | --- |
| Verify chain ID `31337` and `BTCSL2/` banner | Yes | Yes (local profile) | Yes | Real local |
| Read native BTCS balance | Yes | Yes | Yes | Real local |
| Read ERC-20 metadata/balance | Yes | Yes | No (generic `eth_call` only) | Real local |
| Native BTCS transfer | Prepared and reviewed; signed by injected wallet | No | No (read-only by design) | Real transfer signed outside the app; injected-wallet E2E blocked |
| ERC-20 transfer | Prepared and reviewed; signed by injected wallet | No | No | Unit/mock only |
| Receive address display | Yes | No | No | Real local / UI |
| Bounded canonical history scan | Yes, labelled as a scan | No | No | Real local |
| Transaction status and recovery by hash | Yes | Receipt display in Studio | Yes | Real local |
| ERC-20 deployment | No | Yes | No | Real local |
| NFT deployment | No | Disabled | No | Not implemented |
| Payments / payment requests | No | No | No | Not implemented |
| Address index / explorer | No | No | No | Not implemented |
| Finality or settlement proof | No | No | No | Not claimed |

## Fee and nonce behavior

The node has no `eth_gasPrice`, `eth_feeHistory`, or
`eth_maxPriorityFeePerGas`. Applications read `baseFeePerGas` from the latest
block and construct explicit EIP-1559 fields. The wallet shows the fee ceiling
before asking the injected wallet to sign.

`eth_getTransactionCount(address, "pending")` returns `-32602 Invalid params`.
Browser wallets and ethers v6 commonly use `pending` for nonce lookup. This is a
real integration blocker, not an application bug; the wallet probes the method
and surfaces a compatibility warning. Local tests that submit transactions pass
an explicit nonce read from `latest` and sign outside the wallet.

## Reproduce the checks

```sh
# Platform read client against a running local node
cd silver-labs-platform/packages/btcs-l2-client
npm ci
npm test
BTCS_L2_RPC_URL=http://127.0.0.1:18545 npm run test:integration
npm run check:types

# SilverPay wallet
cd SilverPay
npm ci
BTCS_L2_RPC_URL=http://127.0.0.1:18545 \
BTCS_L2_DEV_PRIVATE_KEY=<documented local harness fixture> npm test
npm run build

# SilverForge Studio
cd SilverForge-Studio
npm ci
BTCS_L2_RPC_URL=http://127.0.0.1:18545 \
BTCS_L2_DEV_PRIVATE_KEY=<documented local harness fixture> npm test
```

The harness key is the public fixture documented in
`btcs-l2/execution/evm/src/config.ts`. It is used only to sign outside the
applications against a disposable local chain. It is never requested or stored
by SilverPay or SilverForge.
