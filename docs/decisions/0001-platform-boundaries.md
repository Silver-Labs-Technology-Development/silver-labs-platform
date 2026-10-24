# ADR 0001: Separate shared platform from product repositories

- Status: Accepted for the initial local platform setup
- Date: 2026-10-23

## Context

The local workspace contains BTCS L2 and BTCS Core Git checkouts, but no
dedicated platform repository. Product code and prototypes also exist in
non-Git directories or inside the BTCS L2 checkout. Creating duplicate product
repositories before reconciling those files would risk losing history and
ownership context.

## Decision

Create a separate local `silver-labs-platform` Git repository for genuinely
shared interfaces, SDKs, developer guidance, and integration checks. Do not
move product code or create product repositories in this initial step. Keep
the local BTCS L2 client read-only and identify the local chain by both its
chain ID and `BTCSL2/` client-version prefix.

## Consequences

- Product code remains in its observed location until its history, ownership,
  and remote are reconciled.
- The platform has no configured remote or publication claim yet.
- Consumers can evaluate the client locally, but pinning it as a durable
  dependency awaits an approved remote/versioning process.
- The current SDK identity check is not a consensus or settlement proof.

## Follow-up

Configure an approved remote, pin a release version, and add consumer
compatibility tests after repository permissions and ownership are confirmed.
