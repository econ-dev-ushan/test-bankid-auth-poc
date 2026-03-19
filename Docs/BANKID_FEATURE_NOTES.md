# BankID Feature Notes

## 2026-03-19 - Stage 1 foundation notes

- Backend configuration is centralized through Nest `ConfigModule` and validated with `zod`.
- `BANKID_ENABLED=false` keeps the app runnable before real test certificate material is available.
- When `BANKID_ENABLED=true`, the backend requires `BANKID_PFX_PATH`, `BANKID_PFX_PASSPHRASE`, and `BANKID_CA_PATH`, then eagerly creates the mTLS HTTP agent during module startup.
- `GET /api/bankid/health` exposes safe, frontend-consumable foundation diagnostics only. It does not expose certificate contents, passphrases, or BankID secrets.
- Frontend foundation currently validates backend responses with `zod` and keeps BankID API access behind a dedicated feature module.
- Live BankID auth, collect, QR refresh, and cancel behavior are intentionally deferred to later stages.
