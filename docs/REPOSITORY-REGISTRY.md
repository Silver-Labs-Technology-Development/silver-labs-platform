# Silver Labs repository registry

Local-workspace inventory checked during publication. This records observed
checkout and GitHub state, not an assertion that product work is complete.

| Project | Local path | GitHub repository / branch | Observed status | Ownership and dependencies |
| --- | --- | --- | --- | --- |
| Silver Labs Platform | `~/Silver-Labs/silver-labs-platform` | [silver-labs-platform](https://github.com/Silver-Labs-Technology-Development/silver-labs-platform), `main` | Shared SDK, schema v1, tests, scaffold, and integration documentation are published as source; no package is released. The package currently declares `UNLICENSED`. | Shared SDKs/contracts/guidance |
| BTCS L2 | `~/Silver-Labs/btcs-l2` | [btcs-l2](https://github.com/Silver-Labs-Technology-Development/btcs-l2), `experimental/deposit-prelude-v1` | Canonical standalone development repository for EVM/runtime, SilverPay service, Studio, and asset/token tooling. The local worktree is clean and matches the published branch at `6d78262`. | L2 protocol/execution; integrates with BTCS Core and SilverPay |
| BTCS Core | `~/Silver-Labs/btcs-core` | Upstream: `bitcoin-silver/core`; Silver Labs fork: [Silver-Labs-Bitcoin-Silver-Development](https://github.com/Silver-Labs-Technology-Development/Silver-Labs-Bitcoin-Silver-Development) | Local `main` is clean and matches the organization fork at `0558df8`; it is five commits ahead of the read-only upstream `origin/main`. The `silver-labs-l2` fork branch contains Core-side L2 RPC integration work and is not a replacement for the standalone `btcs-l2` repository. | Owns L1 node/RPC; L2 prototypes trust configured Core RPC |
| BTCS L2 trust sandbox | `~/Silver-Labs/btcs-l2-trust-sandbox` | No GitHub repository verified | Python prototype, tests, reports, and editable portfolio ledger; separate from the BTCS L2 application checkout. | Experimental settlement research |
| SilverPay service | `~/Silver-Labs/btcs-l2/services/silverpay-service` | Source in the standalone [btcs-l2 repository](https://github.com/Silver-Labs-Technology-Development/btcs-l2) | Loopback-only, read-only service; consumes the shared client through a local workspace dependency. | Reads configured Core/L2 RPCs |
| SilverPay Studio | `~/Silver-Labs/btcs-l2/studio` | Source in the standalone [btcs-l2 repository](https://github.com/Silver-Labs-Technology-Development/btcs-l2) | Partial read-only L1/L2 views and token tooling; signing, recovery, history, and payments are not implemented. | Depends on asset and SilverPay services/RPC configuration |
| SilverPay wallet | `~/Silver-Labs/silver-wallet` | [silver-wallet](https://github.com/Silver-Labs-Technology-Development/silver-wallet), `master` | Public wallet application repository. SilverPay is the unified wallet-and-payment-services product; this is its wallet application, not a separate Silver Wallet product. | SilverPay wallet scope |
| SilverForge | `~/Silver-Labs/SilverForge-Studio` | [SilverForge-Studio](https://github.com/Silver-Labs-Technology-Development/SilverForge-Studio), `silverforge-development` | Public standalone frontend source; local suite passed 12/12. BTCS L2 token tooling lives in its standalone repository; the Core branch contains node-side integration changes. | Token tooling; prototype only |
| SilvEx | Removed empty `~/Silver-Labs/silvex` directory | No repository verified | No product source observed; the empty directory was removed during workspace consolidation. | Planned DEX/CEX/DEX Node workstreams |
| Silver Scan | Not found | No repository verified | No local indexer/explorer implementation found. | Future explorer/indexer |
| Silver Node | Not found | No repository verified | No local implementation found. | Future node/RPC workstream |
| BTCS Mining Pool | Not found | No repository verified | No local pool service found. | Future pool accounting/payout workstream |
| POW-S | Not found | No repository verified | No local implementation found. | Future rental design/simulation |

## External reconciliation still required

- Keep BTCS L2 development in its standalone repository. The Core
  `silver-labs-l2` branch is for Core-side integration changes, not a copy of
  the full L2 application. The unified installer and GUI remain future product
  goals requiring coordinated component versions and end-to-end validation.
- The platform source is public; package release and registry publication
  remain separate future gates.
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
configured BTCS Core remotes identify `bitcoin-silver/core` as read-only
upstream and `Silver-Labs-Bitcoin-Silver-Development` as the writable
organization fork; the fork is the publication target, not upstream.

BTCS Core includes L1 mining RPC implementation in `src/rpc/mining.cpp`
(`getmininginfo`, `getnetworkhashps`, `getblocktemplate`, and `submitblock`).
This is node functionality, not evidence of a separate mining-pool service.
