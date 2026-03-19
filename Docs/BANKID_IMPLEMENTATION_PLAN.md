
# BankID Authentication POC Implementation Plan

## 1. Purpose

This document defines the implementation plan for a BankID authentication POC for a future insurance comparison and provider-switching platform.

The immediate goal is:

- implement a secure and extensible BankID authentication flow
- use BankID test environment
- integrate a NestJS backend and a Vite React frontend
- expose the flow on the frontend `/onboarding` page
- after successful authentication, display the authenticated response payload in the UI

This POC must be designed so it can later support:

- signing flows
- provider switching journeys
- consent capture
- transaction signing
- reusable identity and session handling
- auditability and operational observability

---

## 2. Background and BankID Constraints

BankID RP API must be called from the backend, not directly from the browser.

Key implications:

- the backend must hold and use the BankID RP certificate
- the backend must communicate with BankID over mutual TLS
- the frontend must never call BankID directly
- the frontend must never receive secrets that should remain server-side
- the frontend should only interact with our backend API

The POC should support these BankID user journeys:

1. **Mobile BankID on the same device**
   - backend starts auth
   - frontend receives autostart information
   - frontend launches the BankID app via deep link
   - backend polls `collect`
   - frontend shows status updates until completion

2. **Mobile BankID on another device**
   - backend starts auth
   - backend manages animated QR data generation
   - frontend shows animated QR code
   - user scans with BankID app on another device
   - backend polls `collect`
   - frontend shows status updates until completion

3. **Fallback**
   - the UI should allow user recovery when same-device launch fails
   - user should be able to switch to QR flow
   - user should be able to cancel and restart safely

This POC is **auth only**, not sign, but it must be structured so sign can be added with minimal refactoring.

---

## 3. Primary References the Implementer Must Understand

The implementing agent must read and work from these topics before coding:

### Core use cases
- Mobile BankID on the same device
- Mobile BankID on another device
- Fallback flows

### Core technical guides
- autostart
- QR code generation
- return URL
- verifying signatures
- formatting text and parameters
- user messages
- desktop UI resources

### API references
- auth
- sign
- collect
- cancel
- general rules
- errors
- test information

The agent must extract and internalize at minimum:

- required request/response fields
- allowed polling behavior
- meaning of `orderRef`, `autoStartToken`, `qrStartToken`, `qrStartSecret`
- completion payload structure
- `hintCode` semantics
- cancellation rules
- error model
- mTLS certificate requirements
- end-user IP requirements
- recommended UI behavior and messaging
- test environment setup rules

---

## 4. POC Scope

### In scope
- start BankID auth from `/onboarding`
- support same-device flow
- support another-device QR flow
- support cancel flow
- show live order status to user
- show final successful auth payload in UI
- implement backend verification and normalization of BankID response
- implement structured logs and traceable order lifecycle
- use modular architecture suitable for future expansion

### Out of scope
- full production hardening
- persistent database-backed order storage
- multi-tenant partner integration
- production-grade session management
- production-grade user provisioning
- signing flow implementation
- provider switching business logic
- consent document rendering
- advanced mobile device detection beyond what is necessary for POC

---

## 5. Recommended Target Architecture

## 5.1 High-level architecture

### Frontend
React app with:
- React Router data mode
- feature-based module for BankID onboarding
- React Query for async state and polling
- Tailwind for UI
- clear route-level separation

### Backend
NestJS app with:
- dedicated `bankid` module
- REST endpoints for frontend consumption
- BankID client service using Node HTTPS client with mTLS
- domain service handling order lifecycle and response normalization
- validation layer for input and output DTOs
- structured logging and configuration module

---

## 6. Frontend and Backend Responsibilities

## 6.1 Frontend responsibilities

The frontend should:

- render onboarding page with BankID options
- start auth flow by calling backend
- show one of:
  - same-device start button / open-app action
  - QR code for another-device flow
- poll backend for status updates
- show BankID status messages mapped from backend status model
- show cancel and restart options
- render final successful payload
- avoid storing sensitive raw BankID artifacts beyond session need
- avoid embedding BankID-specific secrets in client-side code

## 6.2 Backend responsibilities

The backend should:

- own BankID integration
- authenticate with BankID using test cert
- provide start-auth endpoint
- provide order-status endpoint
- provide QR refresh data endpoint or embed in status response
- provide cancel endpoint
- normalize and validate all BankID responses
- verify completion data before trusting it
- map raw BankID responses into frontend-safe DTOs
- log all lifecycle transitions with correlation IDs
- hide raw `orderRef` from public client if possible behind internal POC order ids

---

## 7. Recommended Project Structure

## 7.1 Frontend

Suggested additions under `frontend/bankid-auth-fe/src`:

```text
src/
  features/
    auth/
      api/
        bankidApi.ts
      components/
        BankIdEntryCard.tsx
        BankIdStatusPanel.tsx
        BankIdQrPanel.tsx
        BankIdResultPanel.tsx
        BankIdErrorPanel.tsx
      hooks/
        useBankIdStart.ts
        useBankIdStatus.ts
        useBankIdCancel.ts
      lib/
        bankidStatusMapper.ts
        bankidFlowDetector.ts
        bankidTypes.ts
      routes/
        onboarding.tsx
````

Recommended shared additions:

```text
src/
  lib/
    api/
      httpClient.ts
    env/
      config.ts
  components/
    ui/
      ...
```

## 7.2 Backend

Suggested additions under backend `src`:

```text
src/
  common/
    config/
    dto/
    filters/
    interceptors/
    logger/
  modules/
    bankid/
      bankid.module.ts
      controller/
        bankid.controller.ts
      dto/
        start-auth.request.dto.ts
        start-auth.response.dto.ts
        status.response.dto.ts
        cancel.request.dto.ts
      services/
        bankid.service.ts
        bankid-rp-api.client.ts
        bankid-order-store.service.ts
        bankid-qr.service.ts
        bankid-completion.service.ts
      types/
        bankid.types.ts
      utils/
        bankid-status.mapper.ts
        bankid-user-message.mapper.ts
```

If the backend currently uses flat structure, the implementing agent may either:

* introduce `src/modules/bankid`

modular structure is preferred.

---

## 8. Recommended Libraries

## 8.1 Frontend

Recommended stable choices:

* `@tanstack/react-query` for polling and mutation state
* `zod` for client-side schema validation of backend DTOs
* `qrcode` or `qr-code-styling` only if frontend must render raw QR text
* optionally `clsx` or `tailwind-merge` if not already present

Recommended install:

```bash
npm install @tanstack/react-query zod
npm install qrcode
```

Optional:

```bash
npm install clsx tailwind-merge
```

## 8.2 Backend

Recommended stable choices:

* `@nestjs/config`
* `class-validator`
* `class-transformer`
* `zod` optional for stricter schema parsing of external BankID responses
* built-in Node `https` or `undici` carefully configured for client certificates
* `pino` or Nest logger integration for structured logs if not already set up

Recommended install:

```bash
npm install @nestjs/config class-validator class-transformer
npm install zod
npm install pino pino-http nestjs-pino
```

Note:

* prefer a low-dependency BankID integration using native `https.Agent` with client certs
* avoid unofficial BankID wrappers unless fully vetted and necessary
* explicit control over mTLS is preferable for long-term maintainability

---

## 9. Configuration Requirements

Backend `.env` should support at least:

```env
NODE_ENV=development
PORT=3000

BANKID_API_BASE_URL=https://appapi2.test.bankid.com
BANKID_RP_API_PREFIX=/rp/v6.0

BANKID_PFX_PATH=/absolute/path/to/certificate.pfx
BANKID_PFX_PASSPHRASE=qwerty123
BANKID_CA_PATH=/absolute/path/to/bankid-test-server-ca.pem

BANKID_REQUEST_TIMEOUT_MS=10000
BANKID_COLLECT_INTERVAL_MS=2000
BANKID_QR_REFRESH_INTERVAL_MS=1000
BANKID_ORDER_TTL_SECONDS=300

FRONTEND_BASE_URL=http://localhost:5173
```

Frontend `.env` should support at least:

```env
VITE_API_BASE_URL=http://localhost:3000
```

The implementing agent must centralize environment loading and validate all required env vars on startup.

---

## 10. Data Contracts

The backend should expose frontend-safe contracts instead of returning raw BankID responses everywhere.

## 10.1 Start auth request

Example request:

```json
{
  "flow": "same-device"
}
```

Or:

```json
{
  "flow": "qr"
}
```

Optional future fields:

* `personalNumber`
* `returnUrl`
* `userVisibleData`
* `userVisibleDataFormat`
* `requireMrtd`
* `certificatePolicies`

## 10.2 Start auth response

Example response:

```json
{
  "orderId": "local-generated-id",
  "flow": "same-device",
  "launch": {
    "autoStartToken": "token",
    "bankIdUrl": "bankid:///?autostarttoken=...&redirect=..."
  },
  "status": {
    "state": "pending",
    "hintCode": "outstandingTransaction",
    "message": "Open your BankID app."
  }
}
```

For QR:

```json
{
  "orderId": "local-generated-id",
  "flow": "qr",
  "qr": {
    "qrStartToken": "opaque-or-not-exposed",
    "refreshIntervalMs": 1000,
    "imageDataUrl": "data:image/png;base64,..."
  },
  "status": {
    "state": "pending",
    "hintCode": "outstandingTransaction",
    "message": "Open BankID on your other device and scan the QR code."
  }
}
```

For stricter design, do not expose `qrStartSecret` to the frontend.

## 10.3 Status response

Example normalized response:

```json
{
  "orderId": "local-generated-id",
  "state": "pending",
  "hintCode": "userSign",
  "message": "Confirm in your BankID app.",
  "flow": "same-device",
  "qr": {
    "imageDataUrl": "data:image/png;base64,...",
    "refreshAt": "2025-01-01T12:00:00.000Z"
  },
  "completion": null
}
```

On success:

```json
{
  "orderId": "local-generated-id",
  "state": "complete",
  "hintCode": null,
  "message": "Authentication completed.",
  "flow": "same-device",
  "completion": {
    "user": {
      "personalNumber": "YYYYMMDDXXXX",
      "name": "Test User",
      "givenName": "Test",
      "surname": "User"
    },
    "device": {
      "ipAddress": "x.x.x.x"
    },
    "bankId": {
      "orderRef": "raw-bankid-order-ref",
      "completionData": {}
    }
  }
}
```

For frontend safety, the POC may show the completion payload, but long-term the backend should return a normalized user object and keep raw completion data server-side.

---

## 11. BankID Domain Model

The backend should track a local in-memory order model for the POC.

Suggested model:

```ts
type BankIdLocalOrder = {
  orderId: string
  bankIdOrderRef: string
  flow: 'same-device' | 'qr'
  status: 'pending' | 'failed' | 'complete' | 'cancelled'
  hintCode?: string | null
  message?: string | null
  autoStartToken?: string
  qrStartToken?: string
  qrStartSecret?: string
  startedAt: string
  lastCollectedAt?: string
  completedAt?: string
  cancelledAt?: string
  completionData?: unknown
}
```

This should live behind a dedicated store service so that later migration to Redis or database is simple.

---

## 12. API Design

Recommended backend endpoints:

### `POST /api/bankid/auth`

Starts BankID auth.

### `GET /api/bankid/orders/:orderId`

Returns normalized status and optional QR image.

### `POST /api/bankid/orders/:orderId/cancel`

Cancels an ongoing BankID order.

Optional:

### `GET /api/bankid/orders/:orderId/qr`

Returns refreshed QR image payload only.

For the POC, status endpoint can include refreshed QR data to reduce frontend complexity.

---

## 13. Implementation Phases

## Phase 1: Foundation and configuration

### Goals

* establish project conventions
* set up configuration and folder structure
* set up logging
* confirm BankID test environment connectivity

### Backend tasks

* add config module
* create `bankid` module skeleton
* define DTOs and types
* implement env validation
* load PFX certificate and CA bundle
* create RP API HTTP client with mutual TLS
* create health-style test method to validate client setup

### Frontend tasks

* create feature folder for onboarding auth
* add React Query provider
* add shared HTTP client wrapper
* define frontend DTO types and schemas

### Exit criteria

* backend starts with validated env
* BankID client can be instantiated without runtime TLS errors
* frontend app compiles with feature scaffolding in place

---

## Phase 2: Start auth flow

### Goals

* implement auth start from backend
* initiate same-device and QR-based journeys
* expose normalized response to frontend

### Backend tasks

* implement `POST /api/bankid/auth`
* accept requested flow type
* detect and pass correct `endUserIp`
* call BankID `auth`
* persist local order state in memory
* create autostart URL for same-device flow
* return local `orderId` and normalized response

### Frontend tasks

* render onboarding options:

  * continue on same device
  * use another device
* call start endpoint
* store active order in local component state or feature state
* open BankID via deep link for same-device flow
* render initial status panel

### Exit criteria

* clicking same-device returns launch URL and order id
* clicking QR flow returns order id and pending state
* no raw backend failures leak unhandled to UI

---

## Phase 3: QR flow support

### Goals

* implement secure animated QR refresh

### Backend tasks

* implement QR generation service from `qrStartToken` and `qrStartSecret`
* generate current QR auth code value using elapsed time rules
* optionally render PNG/Data URL server-side
* include QR image in status response for QR orders

### Frontend tasks

* render QR panel
* refresh status on configured interval
* update displayed QR image every second or according to backend response cadence

### Exit criteria

* QR flow displays changing QR code
* QR flow remains valid while order pending
* user can scan using BankID on another device

---

## Phase 4: Collect polling and state machine

### Goals

* track order lifecycle correctly

### Backend tasks

* implement `collect` call integration
* map raw BankID status to normalized state model
* map `hintCode` to recommended user messages
* persist latest collect response
* stop polling logic once order reaches terminal state

### Frontend tasks

* poll status endpoint using React Query
* stop polling automatically on terminal states
* display state transitions:

  * pending
  * complete
  * failed
  * cancelled

### Exit criteria

* status updates every 2 seconds
* pending hints are visible and understandable
* terminal states stop polling

---

## Phase 5: Completion handling and response rendering

### Goals

* safely handle successful authentication result

### Backend tasks

* parse `completionData`
* verify completion payload according to BankID guidance
* normalize user identity data
* include POC-safe display payload in response
* log successful auth event with correlation id

### Frontend tasks

* render success screen
* show authenticated user payload and raw response section for POC purposes
* show restart action

### Exit criteria

* successful auth displays useful structured data
* no frontend dependence on raw BankID schema details beyond display

---

## Phase 6: Cancel, fallback, and resilience

### Goals

* support robust user recovery

### Backend tasks

* implement cancel endpoint
* call BankID `cancel`
* update local order state
* gracefully handle already-completed or expired orders

### Frontend tasks

* add cancel button for pending flow
* allow restart after cancel/failure
* show fallback option from same-device to QR flow
* handle browser deep link launch failures as UX fallback

### Exit criteria

* user can cancel from UI
* failed same-device flow can transition into QR retry
* order cleanup behavior is predictable

---

## Phase 7: Hardening for maintainability

### Goals

* ensure the POC is extendable

### Tasks

* add tests
* add error handling and exception filters
* add rate limits if needed
* add correlation ids
* add decision log and feature notes
* add changelogs in both backend and frontend

### Exit criteria

* all planned tests pass
* documentation is updated
* code is modular and reviewable

---

## 14. Testing Strategy

## 14.1 Backend unit tests

Must cover:

* BankID response normalization
* hintCode to message mapping
* QR generation logic
* autostart URL builder
* order store lifecycle
* completion data parser
* error mapping

Recommended files:

* `bankid-status.mapper.spec.ts`
* `bankid-qr.service.spec.ts`
* `bankid-completion.service.spec.ts`
* `bankid-order-store.service.spec.ts`

## 14.2 Backend integration tests

Must cover:

* start auth endpoint validation
* successful start auth mocked RP API call
* collect polling state transitions
* cancel endpoint behavior
* error propagation handling

Use mocked BankID API responses, not live BankID in CI.

## 14.3 Frontend unit/component tests

Must cover:

* onboarding page rendering
* start flow action
* status polling behavior
* QR panel rendering
* success payload rendering
* cancel button behavior
* error screen behavior

Recommended tools:

* Vitest
* React Testing Library
* MSW for API mocking

## 14.4 Manual test matrix

### Same-device

* start auth
* deep link launch
* complete authentication
* cancel mid-flow
* expired flow
* app not installed fallback

### Another-device

* start auth
* QR visible and changing
* QR scan
* complete authentication
* cancel mid-flow
* QR order timeout

### Error scenarios

* invalid certificate path
* BankID unavailable
* invalid API response
* collect on unknown order id
* cancel already terminal order
* frontend refresh during pending order

---

## 15. Security and Compliance Notes

Even for a POC, follow these rules:

* never expose certificate material to frontend
* never trust frontend-provided IP
* never persist sensitive secrets in client storage
* never log certificate secrets or QR secrets
* avoid logging personal data at verbose level
* keep raw BankID completion data controlled and masked where necessary
* validate all inbound and outbound payloads
* treat signature/completion verification as server responsibility
* use correlation ids instead of leaking internal data in UI

For the POC, raw response display is allowed only as a deliberate debug view.

---

## 16. UX Guidance for `/onboarding`

The page should be simple and explicit.

Recommended sections:

* title and short explanation
* two choices:

  * use this device
  * use another device
* current status panel
* QR panel when relevant
* success result panel
* error/fallback panel
* cancel and restart actions

Recommended behavior:

* do not auto-start unexpectedly without user action
* after same-device initiation, show a clear "Open BankID" action
* provide fallback to QR if app launch fails
* display friendly messages based on BankID recommended wording
* avoid overly technical error language for user-facing UI

---

## 17. Observability and Logging

The backend must log the order lifecycle using structured logs.

Each log should include:

* correlation id
* local order id
* flow type
* state transition
* BankID hintCode when present
* non-sensitive error metadata

Key events:

* auth_started
* auth_collect_pending
* auth_completed
* auth_failed
* auth_cancel_requested
* auth_cancelled
* qr_generated
* validation_failed

The frontend may log only safe debug data during development.

---

## 18. Future-ready Design Decisions

The POC should deliberately prepare for later sign flow and insurance switching flow.

Design for:

* reuse of same BankID module for both `auth` and `sign`
* normalized completion payload contract
* order storage abstraction
* transaction text formatting support
* future return URL handling
* eventual session issuance after successful auth
* later integration with quote, consent, and provider switching services

---

## 19. Required Documentation Files to Maintain During Implementation

The implementing agent must maintain these files:

### Root-level

* `CHANGELOG.md`
* `docs/DECISIONS.md`
* `docs/BANKID_FEATURE_NOTES.md`

### Frontend

* `frontend/bankid-auth-fe/CHANGELOG.md`

### Backend

* `CHANGELOG.md` at backend root if separate from repo root, otherwise update root changelog with clear backend sections

Rules:

* every meaningful implementation step updates changelog
* every architectural decision updates `docs/DECISIONS.md`
* every special BankID behavior, mapping, edge case, or workaround updates `docs/BANKID_FEATURE_NOTES.md`

---

## 20. Definition of Done

The POC is done when all of the following are true:

* backend can start BankID auth in test environment
* frontend `/onboarding` can initiate same-device flow
* frontend `/onboarding` can initiate another-device QR flow
* frontend can show live pending state and hints
* frontend can cancel an active order
* successful authentication payload is displayed in the UI
* code is modular and documented
* tests for core logic pass
* changelog, decisions, and feature notes are updated
* no secrets are exposed to frontend
* implementation leaves a clean path to future sign flow

---

## 21. Suggested Execution Order for the Agent

1. read all required BankID docs and extract constraints
2. inspect existing frontend and backend bootstrapping
3. establish documentation files and changelog process
4. set up backend config and RP API client
5. implement auth start endpoint
6. implement frontend onboarding start actions
7. implement collect polling and status mapping
8. implement QR generation and display
9. implement cancel and fallback
10. implement completion rendering
11. add tests
12. update docs and decisions

---

## 22. Minimum Accepted Test Passes Before Merge

The implementing agent must not consider the task complete until these are green:

### Backend

* unit tests for QR generation
* unit tests for status mapping
* unit tests for completion parsing
* integration tests for auth start, collect, cancel endpoints

### Frontend

* onboarding render test
* start same-device test
* start QR test
* polling terminal-state stop test
* success payload display test
* cancel flow test

### Manual validation

* at least one successful same-device test journey in BankID test environment
* at least one successful QR test journey in BankID test environment
* at least one cancellation scenario tested manually

---

## 23. Final Implementation Notes

This POC should optimize for:

* correctness
* clear architecture
* explicit contracts
* future extensibility

It should not optimize for:

* premature abstraction
* excessive UI polish
* unnecessary external dependencies

The backend BankID integration and lifecycle handling are the critical parts.
The frontend should remain thin, predictable, and resilient.

