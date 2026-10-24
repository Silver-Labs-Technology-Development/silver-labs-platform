# Release gates

- **Local development:** bind services to loopback, use isolated data
  directories, keep credentials out of fixtures, and identify the exact
  development network profile.
- **Network correctness:** reject chain/profile mismatch. Chain ID `31337` is
  local-development-only and may be shared by unrelated local chains; require
  the BTCS L2 banner as an additional identity check.
- **Read-only client:** do not add signing, key storage, transaction submission,
  or generic RPC passthrough without a separate reviewed design and tests.
- **Data trust:** RPC identity and successful execution do not establish
  consensus validity, L1 inclusion, finality, state-root correctness, or
  trustless settlement. Indexer/UI/CEX data is not consensus-authoritative.
- **Real-value operations:** no production deposits, withdrawals, bridge
  payouts, or custody operations while the settlement P0 gates remain open.
- **Upstream code:** record source remote, exact revision, license, local
  modifications, build/test instructions, and security/custody review before
  reuse. Preserve all notices.
- **Compatibility:** validate schemas against fixtures and consumers; breaking
  contract changes require a new major schema version and migration note.
  Identity-schema tests must cover missing/malformed fields, unknown fields,
  unsupported versions, and supported-profile boundaries. Do not claim a
  compatibility guarantee for unpublished drafts.
- **Evidence:** release notes must distinguish tests against mocks, tests
  against the local implementation, and tests against external networks.
