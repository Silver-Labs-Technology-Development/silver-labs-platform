# ADR 0002: One canonical SilverPay wallet application

- Status: Accepted for local development
- Date: 2026-10-23

## Context

SilverPay work is spread across three surfaces:

1. the browser wallet repository (local directory `SilverPay/`, GitHub
   repository `SilverPay`);
2. the read-only `silverpay-service` inside `btcs-l2/`;
3. the SilverPay page in the `btcs-l2/studio` application.

The service and Studio were built as loopback operator views. Neither holds
keys or implements user signing, recovery, history, or payments. The wallet
repository now contains the only user-facing send/receive flow.

Duplicating wallet logic across all three surfaces would create competing
implementations of network identity, fees, nonce handling, and signing. It would
also make it unclear which surface owns security-sensitive behavior.

## Decision

- The canonical **SilverPay wallet application** is the `SilverPay` repository.
  Its local directory and GitHub repository use the same product name.
- `btcs-l2/services/silverpay-service` and the Studio SilverPay page remain
  **read-only operator views** owned by the protocol repository. They are not
  deleted or copied into the wallet repository.
- User signing is delegated to an injected EIP-1193 wallet. No Silver Labs
  application stores or requests a seed phrase or private key.
- `@silver-labs/btcs-l2-client` is the canonical read contract. Until that
  package is published, the wallet ships a small browser port in
  `src/l2/client.js` so a standalone clone builds. A conformance test compares
  the port's constants with the platform schema when both checkouts exist.
- The capability manifest at `capabilities/v1/l2-capabilities.json` records the
  RPC surface both applications consume. It is an observation, not a
  production or finality claim.

## Consequences

- New wallet features belong in `SilverPay`, not in the protocol repository.
- The service and Studio may add read-only operator views, but must not grow a
  second signing or payment implementation without a new decision.
- The wallet's read client is duplicated temporarily. Publishing the platform
  package with a browser entry is the follow-up that removes the port.
- The wallet cannot complete an injected-wallet transfer while the node rejects
  the `pending` block tag. That is recorded as a protocol integration
  requirement, not worked around with a fake success path.
- Payments remain a later phase. A wallet application is not a payment network.

## Follow-up

1. Publish a reviewed `@silver-labs/btcs-l2-client` browser entry and replace
   the wallet port.
2. Add the local funding method or documented test-account allocation requested
   in the capability manifest.
3. Re-run the injected-wallet end-to-end test after `pending` is accepted or a
   compatible wallet path is documented.
