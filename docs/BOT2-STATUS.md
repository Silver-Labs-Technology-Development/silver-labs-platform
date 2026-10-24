# Bot 2 status — Silver Labs applications

**Date:** 2026-10-23  
**Role:** Bot 2, application engineering  
**Scope:** `SilverPay`, `SilverForge-Studio`, `silver-labs-platform`,
`Official-Website`  
**Not modified:** `btcs-l2` protocol/tests/settlement, `btcs-core` consensus

## Branches and publication

| Repository | Branch | Local HEAD | Remote state |
| --- | --- | --- | --- |
| SilverPay | `master` | `82aed73` | Pushed to `Silver-Labs-Technology-Development/SilverPay`; `origin/master` matches. |
| SilverForge-Studio | `silverforge-development` | `143fd8d` | Pushed to `origin/silverforge-development`; includes the fresh-data-directory note. |
| silver-labs-platform | `main` | code `6bb9ee7`; status commit contains this file | Pushed to `origin/main`. |
| Official-Website | `website-development` | `e1456af` | Pushed to `origin/website-development`. `main` remains at `502d3e5`; the publishing branch is `website-development`. |

`silver-wallet` and `SilverPay` resolve to the same repository and `master`
HEAD. New links use `SilverPay`; the old URL redirects.

## Completed work

### SilverPay wallet

- Replaced the previous mixed wallet/Studio source with a focused browser
  wallet: `src/l2/{client,format,history}.js`,
  `src/wallet/{assets,injected,send}.js`, `src/ui/forms.js`, `src/index.js`,
  `index.html`, `src/style.css`.
- Network identity requires chain ID `31337` **and** the `BTCSL2/` banner.
- Watch-only reads, native and ERC-20 balances, bounded canonical history,
  receive display, send preparation, explicit EIP-1559 fees, injected-wallet
  signing, receipt/recovery states, and a local-only `btcs_dev_mine` step.
- No key input, key storage, seed-phrase request, fake success, or explorer
  claim.
- Added README, architecture and local-network docs, SECURITY, CONTRIBUTING,
  an explicit no-open-source-grant LICENSE, and a Chrome CDP smoke script.
- The browser read client is a documented port of the platform schema v1
  client, with a conformance test when the platform checkout is present.

### SilverForge Studio

- Fixed local fee discovery to read `baseFeePerGas` from the latest block
  instead of calling the absent `eth_gasPrice`.
- Added `mineLocalBlock` for the local development profile only.
- Added a live local test that compiles, deploys, mines, and reads back a real
  ERC-20 contract with an explicit nonce from `latest`.

### Platform

- Added `capabilities/v1/l2-capabilities.json`: observed read/write/
  development-only/unsupported methods, EIP-1559 fee behavior, block-tag
  semantics, signing boundary, trust assumptions, known gaps, and consumers.
- Added `schemas/v1/l2-capabilities.schema.json` and seven schema/semantic
  tests, including malformed/unknown-field rejection and classification
  invariants.
- Added `docs/APP-CAPABILITY-MATRIX.md`, ADR
  `docs/decisions/0002-canonical-silverpay-app.md`, and this status file.
- Updated `docs/INTEGRATION-MAP.md`, `docs/REPOSITORY-REGISTRY.md`, and the
  platform README for the SilverPay rename, capability contract, and verified
  application evidence.

### Official Website

- Updated the SilverPay card to describe the canonical wallet and its real
  limits, including the `pending`-tag blocker.
- Updated the SilverForge test evidence to 17/17 with a disposable node.
- Added a SilverPay quickstart with the local RPC environment variable and a
  note about the `/rpc` proxy.
- Added a link to the application capability matrix.
- Kept all planned-product links explicitly labelled “no implementation”.

## Commands and exact results

All commands used Node.js `24.17.0` and the isolated local node at
`http://127.0.0.1:18545` (banner
`BTCSL2/v0.14-local/ethereumjs-vm-10.1.3/osaka`, chain ID `31337`).

| Command | Result |
| --- | --- |
| `SilverPay`: `BTCS_L2_RPC_URL=... BTCS_L2_DEV_PRIVATE_KEY=<harness fixture> npm test` | **70 tests, 70 pass, 0 fail, 0 skip** |
| `SilverPay`: `npm run build` | Pass; `dist/assets/index-*.js` 104.61 kB (32.82 kB gzip) |
| `SilverPay`: `node scripts/browser-smoke.mjs` | Pass; watch-only balance `9999.995 BTCS`, history scan note, persistence after reload, **0 console errors, 0 exceptions** |
| `SilverPay`: `... npm run test:integration` | **3/3 pass**, including a real transfer signed outside the app, submitted, mined, and receipted |
| `SilverForge-Studio`: `BTCS_L2_RPC_URL=... BTCS_L2_DEV_PRIVATE_KEY=<harness fixture> npm test` | **17 tests, 17 pass, 0 fail, 0 skip**; real ERC-20 deployment included |
| `silver-labs-platform`: `node --test dev/*.test.mjs` | **3/3 pass** |
| `silver-labs-platform/packages/btcs-l2-client`: `npm test` | **20 tests, 19 pass, 0 fail, 1 skip** (live integration needs `BTCS_L2_RPC_URL`) |
| `silver-labs-platform/packages/btcs-l2-client`: `BTCS_L2_RPC_URL=... npm run test:integration` | **1/1 pass** against the live node |
| `silver-labs-platform/packages/btcs-l2-client`: `npm run check:types` | Pass |
| `Official-Website`: `node --test tests/*.test.mjs` | **8/8 pass** |
| `Official-Website`: `node --check projects.mjs`, `node --check site.mjs` | Pass |

The harness key is the public development fixture documented in
`btcs-l2/execution/evm/src/config.ts`. It was supplied only through the test
environment to sign **outside** the applications. No application received or
stored it.

## Fresh-clone verification

Each repository was cloned from its published branch into a new directory,
installed with `npm ci`, and tested. A second, clean node was started at
`http://127.0.0.1:18546` with a fresh data directory for the live cases so that
leftover pending transactions could not affect the nonce.

| Clone | Result |
| --- | --- |
| `SilverPay` `master` @ `82aed73` | `npm ci`; `npm test` with the live node and harness key: **69 pass, 1 skip** (the platform-conformance case skips when the sibling checkout is absent); `npm run test:integration`: **3/3 pass**; `npm run build`: pass. |
| `SilverForge-Studio` `silverforge-development` @ `f9f2e43` | `npm ci`; `npm test` with the clean node and harness key: **17/17 pass**; `npm run build`: pass. A first run against the shared long-lived node failed with `-32010 Transaction nonce is not the next contiguous pending nonce`; a fresh data directory resolved it. |
| `silver-labs-platform` `main` @ `6bb9ee7` | Scaffold tests **3/3**; client `npm ci`, `npm test` **19 pass, 1 skip**; live integration **1/1**; `npm run check:types` pass. |
| `Official-Website` `website-development` @ `e1456af` | `node --check` passes; **8/8** static tests pass. No build step. |

The shared-node nonce failure is an isolation hazard, not a hidden success. The
SilverForge README now tells contributors to use a fresh data directory for each
live run.

## Real evidence versus mocks

**Real local node evidence**

- Platform client identity, canonical block, and account reads.
- SilverPay identity, watch-only balance, bounded history, persistence, and
  validation in headless Chrome.
- SilverPay native transfer signed outside the app, submitted with
  `eth_sendRawTransaction`, mined with `btcs_dev_mine`, and receipted.
- SilverForge ERC-20 compile, deploy, mine, and read-back.

**Unit or mock evidence only**

- SilverPay injected-wallet send preparation, ERC-20 transfer encoding, fee
  ceiling, and error-state rendering. The injected-wallet path is not proven
  end to end.
- Platform unit tests use an isolated mock HTTP server. The live case is the
  separate integration command above.
- Website tests are static source/content checks; the site has no backend.

**Not verified**

- Injected-wallet end-to-end signing and submission.
- Arbitrary-account funding, because there is no faucet or funding RPC.
- Public-network, real-value, finality, settlement, or production behavior.

## Blockers and risks

1. **`pending` block tag rejected.** `eth_getTransactionCount(address,
   "pending")` returns `-32602 Invalid params`. MetaMask and ethers v6 commonly
   use it. The wallet probes the method and warns; it does not fake a send.
2. **No funding method.** Only the genesis fixture account holds BTCS. An
   ordinary injected-wallet account cannot be funded locally.
3. **No CORS headers.** Browser access requires the documented same-origin
   `/rpc` reverse proxy; `dist/` alone cannot reach the node.
4. **No fee discovery methods.** `eth_gasPrice`, `eth_feeHistory`, and
   `eth_maxPriorityFeePerGas` are absent. The wallet uses the latest block base
   fee and shows the ceiling.
5. **No address index.** History is a bounded canonical-block scan; it is not
   an indexer and inclusion is not finality.
6. **Platform package unpublished.** The wallet keeps a browser port so a
   standalone clone builds. This is documented duplication, not a released
   dependency.
7. **Missing protocol contract document.**
   `btcs-l2/docs/DEVELOPER-API-CONTRACT.md` is still absent. The capability
   manifest is the application-side observation until Bot 1 publishes the
   contract.

## Interface requirements for Bot 1

- Accept `pending` as an alias for the current sequencer view in
  `eth_getTransactionCount`, or publish a compatible wallet path.
- Add a local-only funding method such as `btcs_dev_fund`, gated behind
  `--dev-sequencer`, or document a named test-account genesis allocation.
- Publish `btcs-l2/docs/DEVELOPER-API-CONTRACT.md` with supported methods,
  error shapes, and trust boundaries.
- Decide whether the uncommitted `btcs_nodeInfo` / `btcs_health` diagnostics
  are part of the committed interface. They are excluded from the capability
  manifest until committed and documented.
- Keep `eth_gasPrice` / `eth_feeHistory` absent-or-implemented explicit; do not
  silently change fee semantics.

## Next three tasks

1. Run an injected-wallet end-to-end transfer in Chrome once `pending` is
   accepted or a compatible wallet path is documented; record the exact wallet
   and node versions.
2. Add the local funding method or test-account allocation, then verify a
   transfer from a non-genesis injected-wallet account.
3. Publish `@silver-labs/btcs-l2-client` with a browser entry, replace the
   wallet port, and add the conformance check to CI.

## Commits

- `SilverPay` `fa3b44b` — implement wallet send, asset, history, and recovery
  flows.
- `SilverPay` `82aed73` — update the security contact after the repository
  rename.
- `SilverForge-Studio` `f9f2e43` — verify local BTCS L2 fees, mining, and token
  deployment.
- `SilverForge-Studio` `143fd8d` — document the fresh-data-directory requirement
  for live L2 tests.
- `silver-labs-platform` `6bb9ee7` — document and validate the local L2
  application capability contract; this status update is a follow-up commit.
- `Official-Website` `502d3e5` — link verified planned repositories without
  implying implementation.
- `Official-Website` `99e3673` — update SilverPay links after the rename.
- `Official-Website` `e1456af` — describe SilverPay wallet capabilities and
  local test requirements.

All pushes were fast-forward to existing development branches. No history was
rewritten and no force-push was used.
