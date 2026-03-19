# Changelog

## Unreleased

### Added
- Stage 1 BankID auth feature scaffold with React Query providers, API client setup, and typed response schemas.
- A routed onboarding foundation screen that is ready for same-device and QR actions in later stages.

### Changed
- Phase 2 now starts same-device and QR auth flows from `/onboarding` and renders the initial pending state from the backend response.
- Same-device starts now expose an explicit "Open BankID" action instead of trying to auto-launch unexpectedly.
- Phase 3 now renders animated QR images from backend status polling for another-device BankID flows.
- Phase 4 now polls order status for both same-device and QR flows and stops automatically on terminal states.
- Phase 5 now shows a dedicated success screen with normalized identity details and the raw completion payload for POC debugging.
- Phase 6 now supports cancelling pending orders and retrying same-device failures through a direct QR fallback action.
