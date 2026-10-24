# Silver Labs Platform

Shared developer tooling, network identity contracts, repository scaffolding,
and read-only BTCS L2 client code for Silver Labs projects.

## Current scope

- `packages/btcs-l2-client` is a read-only client for the local BTCS L2
  development profile (`chainId: 31337`, `BTCSL2/` client banner). It does not
  sign, submit transactions, or prove consensus/finality.
- `schemas/v1` defines the matching local network identity contract.
- `dev` contains a safe repository scaffold utility.
- `docs` records repository boundaries, compatibility policy, release gates,
  local setup, and development workflow.

The package is present in this public repository but has not been released to a
package registry. Its `package.json` currently declares `UNLICENSED`; no reuse
or redistribution license is granted by this repository yet.

## Checks

Run the scaffold tests from the repository root:

```sh
node --test dev/*.test.mjs
```

Run SDK checks from `packages/btcs-l2-client`:

```sh
npm ci
npm test
npm run check:types
```

The optional integration test requires an isolated local BTCS L2 RPC:

```sh
BTCS_L2_RPC_URL=http://127.0.0.1:8545 npm run test:integration
```

See [development environment](docs/DEVELOPMENT-ENVIRONMENT.md),
[architecture](docs/ARCHITECTURE.md), and
[network identity compatibility](docs/NETWORK-IDENTITY-COMPATIBILITY.md) for
the supported local setup and limitations.
