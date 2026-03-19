# Changelog

## Unreleased

### Added
- Stage 1 BankID backend foundation with validated environment loading, a dedicated `bankid` module, and a health endpoint at `GET /api/bankid/health`.
- Stage 1 frontend auth feature scaffolding with React Query, typed BankID DTO parsing, and a routed onboarding foundation screen.
- Initial BankID implementation documentation set, including decision logging and feature notes.

### Fixed
- Enabled backend CORS for the configured frontend origin so the onboarding app can call `GET /api/bankid/health` from the browser during local development.

### Changed
- Phase 2 now exposes `POST /api/bankid/auth`, persists local BankID orders, and returns normalized same-device or QR start responses for the onboarding flow.
- The frontend `/onboarding` page now starts same-device and QR auth flows, renders the initial pending status, and shows the deep link action for same-device starts.
- Backend now logs incoming HTTP requests and completed responses with method, path, IP, status code, and duration for local observability.
- Backend now also logs outbound BankID RP API calls with minimal structured metadata for request start, completion, and failure events.
- Phase 3 now generates animated QR frames on the backend, exposes `GET /api/bankid/orders/:orderId`, and refreshes QR rendering on the frontend without exposing QR secrets.
- Backend BankID TLS failures now log targeted diagnostic hints for common certificate-chain, PKCS#12, and passphrase setup errors.

### Docs
- Recorded request-level backend logging as an ongoing convention for future BankID feature implementations.
- Recorded that future BankID polling logs must stay info-level and minimal rather than dumping raw collect payloads.
