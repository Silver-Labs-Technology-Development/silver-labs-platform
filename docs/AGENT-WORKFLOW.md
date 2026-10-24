# Agent workflow

## Assignment format

Each task should name one owning repository, an exclusive file scope, its
integration dependencies, acceptance criteria, and exact test commands. The
platform lead owns cross-repository compatibility decisions and integration
review; product agents own product code.

## Specialist-agent startup and boundaries

1. Use `docs/REPOSITORY-REGISTRY.md` to select the observed repository. If no
   repository exists or ownership is unknown, work only on a platform-owned
   contract/proposal and mark product implementation blocked pending owner
   assignment; do not create a duplicate repo.
2. Read that repository's `AGENTS.md`, release/security notes, and this
   platform's relevant integration contract before editing.
3. Follow the repository's pinned runtime and development instructions. Use
   isolated loopback endpoints and data directories for local L2 work.
4. Consume the versioned package/schema through a pinned package release, or
   the explicitly documented local file dependency until a package release is
   published. Do not copy RPC helpers or import product internals across repo
   boundaries. Read `docs/NETWORK-IDENTITY-COMPATIBILITY.md`; only the local
   `BTCS_L2_LOCAL` profile is supported, and the workspace `file:` dependency
   is not a published release.
5. Run the owning project's unit checks and real local integration check for
   the changed boundary. Never represent a skipped integration as passed.
6. Hand off repository/branch, exclusive files changed, test command/output,
   limitations, owner/dependency, and next acceptance criterion. Update the
   portfolio ledger when status or ownership changes.

Exclusive current scopes: platform agents own
`silver-labs-platform/packages/**`, `schemas/**`, `dev/**`, and platform docs;
the BTCS L2 protocol agent owns `btcs-l2/execution/evm/**`; the SilverPay
agent owns `btcs-l2/services/silverpay-service/**`. Cross-boundary dependency,
schema, and compatibility edits require coordination with the platform owner.

Use `node dev/scaffold-repository.mjs <project-slug> <destination>` to create
a new language-neutral starter. It will not adopt or overwrite an existing
directory. Add the product's actual toolchain, CI, and test commands only after
the project language and build system are known.

## Parallel work rules

- Give each worker one repository or non-overlapping file scope.
- Do not have multiple workers edit shared schemas or SDK APIs concurrently.
- Product agents must not import another repository's internal source files.
- Route proposed public API changes through the platform owner and update
  versioned schemas and compatibility notes.
- No agent is considered active merely because its role appears in a document.

## Handoff format

Report repository and branch, changed files, behavior delivered, test commands
and outcomes, known limitations, security boundary, and the next acceptance
criterion. Preserve and disclose pre-existing dirty files; never clean them up
as part of a handoff.

## Initial workstreams

1. **BTCS L2 protocol:** own execution and RPC behavior; first task is to
   publish a versioned list of supported RPC methods with corresponding tests.
2. **SilverPay:** own wallet/account presentation and service boundary; first
   task is to consume the shared read-only client through a versioned adapter
   without adding signing or send paths.
3. **Platform:** own the shared client, schemas, registry, and local smoke
   checks; first task is to verify a supported Node 24 local RPC integration
   and then propose the next consuming repository.
4. **Security review:** independently review any proposed write, custody,
   bridge, or settlement capability before release.

Silver Scan, SilverForge, SilvEx DEX/CEX/DEX Node, Silver Node, mining pool,
and POW-S agents are not configured or launched by this repository; their
repository ownership remains unestablished unless the live registry is
updated with evidence.
