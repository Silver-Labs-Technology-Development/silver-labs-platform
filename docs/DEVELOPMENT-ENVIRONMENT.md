# Local development environment

## Supported Node runtime

The BTCS L2 EVM package and SilverPay service both declare Node.js
`>=24.17.0 <25`. The platform SDK itself declares Node `>=18`, but an
integrated L2/SilverPay verification must use the L2-supported runtime.

For Linux x64 without a version manager, Node `24.17.0` was installed at
`~/.local/node-v24.17.0-linux-x64` after its archive checksum was checked
against the official Node.js `SHASUMS256.txt`. This does not modify system
Node. To repeat manually, download the matching `node-v24.17.0-linux-x64.tar.xz`
and `SHASUMS256.txt` from `https://nodejs.org/dist/v24.17.0/`, verify the
archive SHA-256 against that checksum file, extract into a new versioned
directory under `~/.local`, and prepend its `bin` directory to `PATH`:

```sh
set -eu
mkdir -p "$HOME/.local"
test ! -e "$HOME/.local/node-v24.17.0-linux-x64"
curl --fail --location --output /tmp/node-v24.17.0-linux-x64.tar.xz \
  https://nodejs.org/dist/v24.17.0/node-v24.17.0-linux-x64.tar.xz
curl --fail --location --output /tmp/node-v24.17.0-SHASUMS256.txt \
  https://nodejs.org/dist/v24.17.0/SHASUMS256.txt
grep '  node-v24.17.0-linux-x64.tar.xz$' /tmp/node-v24.17.0-SHASUMS256.txt \
  > /tmp/node-v24.17.0-linux-x64.sha256
(cd /tmp && sha256sum --check node-v24.17.0-linux-x64.sha256)
mkdir "$HOME/.local/node-v24.17.0-linux-x64"
tar -xJf /tmp/node-v24.17.0-linux-x64.tar.xz --strip-components=1 \
  -C "$HOME/.local/node-v24.17.0-linux-x64"
export PATH="$HOME/.local/node-v24.17.0-linux-x64/bin:$PATH"
node --version
npm --version
rm /tmp/node-v24.17.0-linux-x64.tar.xz \
  /tmp/node-v24.17.0-SHASUMS256.txt \
  /tmp/node-v24.17.0-linux-x64.sha256
```

Require `v24.17.0` for the documented run. Do not replace `/usr/bin/node`,
reuse an existing install directory without checking it, or downgrade project
engine declarations to match a shell's default runtime. For other platforms,
use the official archive matching the OS and CPU architecture and verify its
published checksum before extraction.

## BTCS L2 RPC

The local RPC implementation is under
`~/Silver-Labs/btcs-l2/execution/evm`. Its package documents a Node.js
`>=24.17.0 <25` requirement. In a clean checkout:

```sh
cd ~/Silver-Labs/btcs-l2/execution/evm
npm ci
npm run rpc -- --datadir /tmp/btcs-l2-local-rpc --port 18545
```

The RPC binds to `127.0.0.1`. Do not expose it to a LAN or the public internet.
The directory is local development state; choose an isolated path and do not
reuse important data. The default RPC is read-only; `--dev-sequencer` enables
explicit development transaction submission/mining and must not be enabled for
ordinary read-only integration tests.

## Shared client tests

In another terminal:

```sh
cd ~/Silver-Labs/silver-labs-platform/packages/btcs-l2-client
npm test
BTCS_L2_RPC_URL=http://127.0.0.1:18545 npm run test:integration
```

The integration test checks the client banner and chain ID, reads the actual
local block/account data, and confirms unknown transaction/receipt lookups are
reported as missing. It does not exercise signing, transaction submission,
settlement, or reorganization recovery.

## SilverPay consumer test

From `~/Silver-Labs/btcs-l2/services/silverpay-service`, install the
workspace-local shared package and lockfile:

```sh
npm ci
SILVERPAY_L2_RPC_URL=http://127.0.0.1:18545 npm run test:integration
npm test
npm run check
```

The service uses `file:../../../silver-labs-platform/packages/btcs-l2-client`
for this local workspace integration. The platform source repository is
available at
<https://github.com/Silver-Labs-Technology-Development/silver-labs-platform>,
but the package itself has not been published; another checkout must provide
the sibling platform directory for this workspace dependency.

## Repository/Git workflow

The canonical public GitHub repository is
<https://github.com/Silver-Labs-Technology-Development/silver-labs-platform>.
The local `main` branch tracks `origin/main`. Changes should be developed on
short task branches such as `feat/<task-slug>`, `fix/<task-slug>`, or
`docs/<task-slug>`, then reviewed and merged to `main`.

Repository maintainers should:

1. Preserve existing history and inspect `git remote -v` before changing
   remotes.
2. Do not share writable worktrees for the same files.
3. Open a pull request against `main`. Require review
   from the relevant package/product owner and a security reviewer for writes,
   custody, bridge, or settlement changes.
4. Require SDK unit/type checks, scaffold tests, and the actual local RPC
   integration check for client/API changes. Product changes also require
   that product's unit and integration tests. Record skipped external tests
   and why.
5. Release only from a reviewed tag/version with a compatibility note and
   verified artifact/registry publication. Until publishing is configured,
   consumers must identify their local file dependency and must not claim a
   package release.

No package release or registry publication is configured.

## Current environment note

The system default remains Node.js `18.19.1` / npm `9.2.0`. A checksum-verified
Node.js `24.17.0` / npm `11.13.0` was installed separately at
`~/.local/node-v24.17.0-linux-x64`; prepend its `bin` directory to `PATH` for
the integrated EVM and SilverPay commands above. The SDK package advertises
Node `>=18`; its local-RPC integration and SilverPay consumer are verified
under Node 24.17.0. This does not establish compatibility with all Node 18
patch versions.

No container orchestration is required or configured by this initial platform
slice. Other product services remain independently runnable in their own
directories.
