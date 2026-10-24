# Silver Labs platform agent instructions

## Boundaries

- This repository owns shared developer tooling, integration contracts, and
  libraries used by multiple Silver Labs products. Product application code
  stays in its owning repository.
- Treat the BTCS L2 implementation, BTCS Core, product APIs, and schemas as
  independent versioned boundaries. Do not import internal implementation
  files across repositories.
- Verify actual supported behavior before documenting or exposing it. A local
  RPC connection is not proof of consensus, settlement, finality, or trustless
  operation.
- Keep development-only chain IDs, test keys, and fixtures explicitly
  separated from testnet and production. Never add secrets or private-key
  handling to shared configuration or read-only clients.

## Changes and verification

- Preserve uncommitted changes in every repository. Do not reset, overwrite, or
  delete existing user work.
- Keep changes focused on platform-owned files. Update the integration
  registry and relevant contract documentation when public interfaces change.
- Run the narrowest relevant package tests, then type checks or integration
  checks when applicable. State clearly when an external service or runtime
  requirement prevented a check.
- Do not claim a remote repository, published package, running agent, or
  production capability unless it was directly verified.

## Handoffs

Every handoff should state the repository and files changed, commands and
results, remaining limitations, and the next acceptance criterion. Update the
project registry when ownership or status changes.
