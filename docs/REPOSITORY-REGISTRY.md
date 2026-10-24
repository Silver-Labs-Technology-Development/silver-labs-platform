# Silver Labs repository registry

Observed workspace and GitHub inventory after the 2026-10-23 organization pass.
This registry records product boundaries and repository ownership. It is not an
assertion that any product is complete or production-ready.

## Published and local repositories

| Product | Local path | Canonical repository / branch | Status | Boundary and dependencies |
| --- | --- | --- | --- | --- |
| BTCS Core | `~/Silver-Labs/btcs-core` | Upstream `bitcoin-silver/core`; org fork [Silver-Labs-Bitcoin-Silver-Development](https://github.com/Silver-Labs-Technology-Development/Silver-Labs-Bitcoin-Silver-Development), `main` | Existing L1 fork; builds locally; Silver Labs changes are experimental | Owns L1 node, RPC, CLI, and Qt wallet. L2 prototypes are separate repositories and consume its RPC. |
| BTCS L2 | `~/Silver-Labs/btcs-l2` | [btcs-l2](https://github.com/Silver-Labs-Technology-Development/btcs-l2), `experimental/deposit-prelude-v1` | Prototype, locally tested | EVM execution, sequencing, settlement research, deposits/withdrawals, local RPC, and Studio. Not trustless or production-ready. |
| SilverPay | `~/Silver-Labs/SilverPay` | [SilverPay](https://github.com/Silver-Labs-Technology-Development/SilverPay), `master` | Prototype wallet; 70/70 local tests with harness key; injected-wallet signing unverified; payments not implemented | Unified wallet/account/payment product boundary. Canonical wallet application; see [ADR 0002](./decisions/0002-canonical-silverpay-app.md). The former `silver-wallet` URL redirects to this repository. |
| SilverForge Studio | `~/Silver-Labs/SilverForge-Studio` | [SilverForge-Studio](https://github.com/Silver-Labs-Technology-Development/SilverForge-Studio), `silverforge-development` | Development prototype | Static token/NFT creation frontend and BSNA research. `gh-pages` is a generated preview branch. |
| SilvEx CEX | `~/Silver-Labs/SilvEx-CEX` | [SilvEx-CEX](https://github.com/Silver-Labs-Technology-Development/SilvEx-CEX), `main` | Planned; scope only | Centralized exchange. No accounts, custody, matching, deposits, withdrawals, or trading implementation. |
| SilvEx DEX | `~/Silver-Labs/SilvEx-DEX` | [SilvEx-DEX](https://github.com/Silver-Labs-Technology-Development/SilvEx-DEX), `main` | Planned; scope only | Wallet-authorized, non-custodial exchange. No contracts, pools, router, quote engine, or swap interface. |
| SilvEx DEX Node | `~/Silver-Labs/SilvEx-DEX-Node` | [SilvEx-DEX-Node](https://github.com/Silver-Labs-Technology-Development/SilvEx-DEX-Node), `main` | Planned; scope only | DEX-specific indexing, routing, pool data, and quotes. Only justified by a selected DEX architecture. |
| Silver Scan | `~/Silver-Labs/Silver-Scan` | [Silver-Scan](https://github.com/Silver-Labs-Technology-Development/Silver-Scan), `main` | Planned; scope only | L1/L2 explorer and indexing. Studio's bounded local view is not an explorer. |
| BTCS Mining Pool | `~/Silver-Labs/BTCS-Mining-Pool` | [BTCS-Mining-Pool](https://github.com/Silver-Labs-Technology-Development/BTCS-Mining-Pool), `main` | Planned; scope only | Stratum, share validation, block submission, and payout accounting. Distinct from L2 sequencing. |
| POW-S | `~/Silver-Labs/POW-S` | [POW-S](https://github.com/Silver-Labs-Technology-Development/POW-S), `main` | Research / planned; scope unresolved | Proof-of-work services research. No service, API, contract, or customer model is defined. |
| Silver Labs Platform | `~/Silver-Labs/silver-labs-platform` | [silver-labs-platform](https://github.com/Silver-Labs-Technology-Development/silver-labs-platform), `main` | Prototype shared SDK and verified capability contract | Shared read-only L2 client, capability manifest/schema, integration contracts, and scaffolding. Product implementation stays in product repositories. Package is `UNLICENSED` and not published to a registry. |
| Official Website | `~/Silver-Labs/Official-Website` | [Official-Website](https://github.com/Silver-Labs-Technology-Development/Official-Website), `website-development` and `main` | Implemented static developer site | Public status, architecture, verified repository links, and quickstart. No backend, custody, or production claims. |
| BTCS L2 trust sandbox | `~/Silver-Labs/btcs-l2-trust-sandbox` | No remote; local Git history only | Local research prototype | BitVM-style settlement and recovery research. 21/21 local tests. Intentionally unpublished; publication needs explicit owner approval. |

## Publication rules

- Every product has one local directory and one Git root.
- The workspace root is not a Git repository. `docs/`, `shared/`, and `archive/`
  are workspace-level folders and must not become nested repositories.
- Existing repository names are retained unless a rename has a documented,
  verified benefit. The SilverPay repository was renamed from `silver-wallet`
  to `SilverPay`; both URLs resolve to the same `master` HEAD. Use the
  `SilverPay` URL for new links.
- BTCS Core and BTCS L2 remain separate repositories. A future end-user
  distribution may package compatible components, but must not merge their Git
  histories.
- Planned repositories contain scope documents only. They must not be linked as
  implementations or described as available products.

## Planned repository decisions

Six public repositories were created on 2026-10-23 for products that had no
existing repository: `SilvEx-CEX`, `SilvEx-DEX`, `SilvEx-DEX-Node`,
`Silver-Scan`, `BTCS-Mining-Pool`, and `POW-S`. Each contains a status banner,
purpose, proposed scope, non-goals, decisions required, and an explicit
"no implementation" statement. No upstream code was copied into them.

No license was added to any planned repository. Public visibility is for
planning transparency only; no reuse rights are granted. A license must be
chosen deliberately after the implementation model and any upstream obligations
are known.

## External reconciliation still required

- Keep BTCS L2 development in its standalone repository. The Core
  `silver-labs-l2` branch is for Core-side integration changes, not a copy of
  the full L2 application. The unified installer and GUI remain future product
  goals requiring coordinated component versions and end-to-end validation.
- The platform source is public; package release and registry publication
  remain separate future gates.
- Pin and review OpenCEX upstream revision, license, build, custody design, and
  security posture before any CEX integration.
- Review CKPool's GPL-3.0 obligations and runtime compatibility before adapting
  any pool code.
- The SilverForge `gh-pages` preview is live without a recorded owner approval.
  Its generated branch tracks `node_modules`; resolve the policy and deployment
  method without rewriting public history.

## Verification

`shared/verify-workspace.sh` validates the 13-product layout, expected remotes,
branches, tracking relationships, key files, worktree state, and the absence of
tracked wallet/secret artifacts or accidental nested Git roots. Current test
results and commit SHAs are recorded in `WORKSPACE-INDEX.md`.
