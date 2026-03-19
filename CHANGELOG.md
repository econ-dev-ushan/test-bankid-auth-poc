# Changelog

## Unreleased

### Added
- Stage 1 BankID backend foundation with validated environment loading, a dedicated `bankid` module, and a health endpoint at `GET /api/bankid/health`.
- Stage 1 frontend auth feature scaffolding with React Query, typed BankID DTO parsing, and a routed onboarding foundation screen.
- Initial BankID implementation documentation set, including decision logging and feature notes.

### Fixed
- Enabled backend CORS for the configured frontend origin so the onboarding app can call `GET /api/bankid/health` from the browser during local development.
