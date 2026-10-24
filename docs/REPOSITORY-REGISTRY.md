# Silver Labs repository registry

Local-workspace inventory checked during publication. This records observed
checkout and GitHub state, not an assertion that product work is complete.

| Project | Local path | GitHub repository / branch | Observed status | Ownership and dependencies |
| --- | --- | --- | --- | --- |
| Silver Labs Platform | `~/Silver-Labs/silver-labs-platform` | [silver-labs-platform](https://github.com/Silver-Labs-Technology-Development/silver-labs-platform), `main` | Public remote exists. Local SDK, schema v1, tests, scaffold, and integration documentation are pending publication; no package is released. | Shared SDKs/contracts/guidance |
| BTCS L2 | `~/Silver-Labs/btcs-l2` | Intended home: [Silver-Labs-Bitcoin-Silver-Development, `silver-labs-l2`](https://github.com/Silver-Labs-Technology-Development/Silver-Labs-Bitcoin-Silver-Development/tree/silver-labs-l2) | Local EVM/runtime, SilverPay service, Studio, and asset/token tooling are currently in a separate checkout. Migration into the designated branch is in progress; do not treat the standalone `btcs-l2` repository as canonical. The current local worktree has uncommitted changes. | L2 protocol/execution; integrates with BTCS Core and SilverPay |
| BTCS Core | `~/Silver-Labs/btcs-core` | Upstream: `bitcoin-silver/core`; Silver Labs fork: [Silver-Labs-Bitcoin-Silver-Development](https://github.com/Silver-Labs-Technology-Development/Silver-Labs-Bitcoin-Silver-Development) | Local `main` is clean and two commits ahead of its upstream remote. The `silver-labs-l2` fork branch contains Silver Labs L2-specific Core RPC changes. | Owns L1 node/RPC; L2 prototypes trust configured Core RPC |
| BTCS L2 trust sandbox | `~/Silver-Labs/btcs-l2-trust-sandbox` | No GitHub repository verified | Python prototype, tests, reports, and editable portfolio ledger; separate from the BTCS L2 application checkout. | Experimental settlement research |
| SilverPay service | `~/Silver-Labs/btcs-l2/services/silverpay-service` | Source in BTCS L2; intended destination is the `silver-labs-l2` branch | Loopback-only, read-only service; consumes the shared client through a local workspace dependency. | Reads configured Core/L2 RPCs |
| SilverPay Studio | `~/Silver-Labs/btcs-l2/studio` | Source in BTCS L2; intended destination is the `silver-labs-l2` branch | Partial read-only L1/L2 views and token tooling; signing, recovery, history, and payments are not implemented. | Depends on asset and SilverPay services/RPC configuration |
| SilverPay wallet | `~/Silver-Labs/silver-wallet` | [silver-wallet](https://github.com/Silver-Labs-Technology-Development/silver-wallet), `master` | Public wallet application repository. SilverPay is the unified wallet-and-payment-services product; this is its wallet application, not a separate Silver Wallet product. | SilverPay wallet scope |
| SilverForge | `~/Silver-Labs/SilverForge-Studio` | [SilverForge-Studio](https://github.com/Silver-Labs-Technology-Development/SilverForge-Studio), `silverforge-development` | Public standalone frontend source; local suite passed 12/12. BTCS L2 token tooling also exists in the L2/Core work. | Token tooling; prototype only |
| SilvEx | `~/Silver-Labs/silvex` | No repository verified | Local directory is empty; no product source observed. | Planned DEX/CEX/DEX Node workstreams |
| Silver Scan | Not found | No repository verified | No local indexer/explorer implementation found. | Future explorer/indexer |
| Silver Node | Not found | No repository verified | No local implementation found. | Future node/RPC workstream |
| BTCS Mining Pool | Not found | No repository verified | No local pool service found. | Future pool accounting/payout workstream |
| POW-S | Not found | No repository verified | No local implementation found. | Future rental design/simulation |

## External reconciliation still required

- Complete the BTCS L2 subtree migration into the designated
  `silver-labs-l2` branch, verify the pushed commit and tests, then retire the
  standalone repository as directed by the project owner.
- Publish the reviewed platform source to its existing public remote; the
  package release and registry publication remain separate future gates.
- Pin and review OpenCEX upstream revision, license, build, custody design, and
  security posture before any integration.

No new repository was created during this publication pass. Existing public
repositories were verified before use; no product ownership was inferred from
a local directory name.

The local-only network identity schema v1 and tested consumer path establish
SDK/API compatibility for the BTCS L2 development profile only. They do not
establish product ownership, a published package release, public-network
support, or production settlement security.

Multiple configured Git remotes and local worktrees were verified directly.
Directories without `.git` metadata were inspected as local folders only; no
external or inaccessible repositories were inferred.

The table records repository/product boundaries, not named maintainers. No
accountable human owner or active agent assignment was established from the
inspected files; ownership for SilverForge, SilverPay, Silver Scan, SilvEx,
Silver Node, mining pool, and POW-S remains unassigned or undocumented. The
configured BTCS Core remote identifies `bitcoin-silver/core`, but its canonical
relationship to the Silver Labs organization was not established.

BTCS Core includes L1 mining RPC implementation in `src/rpc/mining.cpp`
(`getmininginfo`, `getnetworkhashps`, `getblocktemplate`, and `submitblock`).
This is node functionality, not evidence of a separate mining-pool service.
