# Decisions

## 2026-03-19 - Gate live BankID certificate validation behind `BANKID_ENABLED`

### Context
The BankID backend foundation needs strict validation for certificate-based configuration, but this repository does not yet include live BankID test certificates for every local environment.

### Decision taken
The backend now validates the full BankID certificate settings only when `BANKID_ENABLED=true`. When disabled, the application still boots with safe defaults so the frontend and backend scaffolding can be developed and verified incrementally.

### Alternatives considered
- Require live BankID certificate paths in all environments immediately.
- Stub certificate files in source control for local development.

### Consequences
- Local development stays runnable before test certificates are provisioned.
- Enabling live BankID will fail fast if certificate inputs are incomplete.
- A future stage should flip `BANKID_ENABLED=true` in real integration environments and verify connectivity with actual test credentials.

## 2026-03-19 - Introduce the BankID order store abstraction in Phase 1

### Context
The implementation plan calls for backend-owned order lifecycle tracking, and later stages will need auth start, collect polling, QR refresh, and cancel behavior to share the same order state.

### Decision taken
An in-memory `BankIdOrderStoreService` has been added during Stage 1 instead of waiting for the first write path.

### Alternatives considered
- Store order state directly inside the orchestration service for now.
- Delay local order persistence until the auth endpoint exists.

### Consequences
- Later stages can build on a stable ownership boundary immediately.
- Migration to Redis or a database remains straightforward.
- The current implementation is intentionally minimal and will be expanded in later stages.
