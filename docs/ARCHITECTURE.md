# Silver Labs platform architecture

## Ownership

The platform repository owns genuinely shared code, schemas, repository
onboarding, and integration tests. Each product repository owns its own
application, data model, deployment configuration, and release lifecycle.
Shared packages must not reach into product-internal files.

## Current verified local topology

```text
BTCS Core (L1 node and RPC)
        |
        +-- trusted local RPC --> BTCS L2 deposit/settlement prototypes
                                      |
                                      +-- loopback EVM JSON-RPC
                                            |
                                            +-- shared read-only L2 client
                                            +-- SilverPay service / Studio
```

The SilverPay service and Studio currently live inside the BTCS L2 checkout.
They consume configured RPC endpoints; they do not independently verify L1 or
L2 consensus. SilverForge-related work is also present in BTCS Core UI and
BTCS L2 token tooling; the standalone frontend source is in the public
`SilverForge-Studio` repository.

Silver Scan, SilvEx products, the mining pool, and POW-S were not found as Git
repositories in the inspected workspace. Their APIs and product boundaries
must be agreed before creating cross-product dependencies.

## Trust and data authority

- BTCS Core owns the L1 node's view of its active chain. The current local
  settlement workflows trust the configured Core RPC for observations.
- The BTCS L2 local RPC exposes its canonical local execution view. A client
  banner and chain ID establish configured network identity only; neither
  proves consensus, state correctness to an external verifier, or finality.
- Product services and indexers may cache or present L1/L2 data but are not
  authoritative for either chain.
- Shared contracts identify source and lifecycle fields; they do not upgrade
  the security properties of their data source.

## Compatibility

Contracts are versioned under `schemas/vN/`. Breaking changes require a new
major schema version and a migration/compatibility note. Shared package
versions must be pinned by consuming products. Local development profile
`31337` is not a production network assignment.
