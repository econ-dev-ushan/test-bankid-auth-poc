# BankID POC Agent Guide

## 1. Purpose of This Guide

This guide defines how the implementation agent must behave while building the BankID authentication POC across the NestJS backend and Vite React frontend.

The goal is not only to deliver working code, but to deliver code that is:

- modular
- correct
- reviewable
- secure
- easy to extend
- documented for future work

This guide must be followed throughout implementation.

---

## 2. Core Mission

Build a BankID authentication POC for the onboarding flow of an insurance platform.

Immediate user-facing outcome:
- on `/onboarding`, user can authenticate with BankID
- support same-device and another-device QR flow
- display final authenticated response

Longer-term architectural outcome:
- establish a clean BankID integration foundation for future sign flows, consent flows, and insurance provider switching flows

---

## 3. Non-Negotiable Implementation Principles

The agent must always:

- prefer correctness over speed
- prefer explicit code over clever code
- prefer modularity over shortcuts
- prefer stable and widely adopted libraries
- keep frontend BankID logic thin
- keep backend as the owner of the BankID protocol and secrets
- write code that a future engineer can understand quickly
- keep responsibilities separated
- update documentation as work progresses
- leave decision traces for future maintainers

The agent must never:

- call BankID directly from frontend
- expose certificate material or sensitive BankID secrets to frontend
- hardcode environment-specific values in source files
- tightly couple UI components to raw BankID API responses
- bury BankID logic in generic utility files without clear ownership
- skip changelog or decision log updates for meaningful changes

---

## 4. Required Working Style

For each implementation step, the agent must do the following:

1. inspect current code before modifying it
2. understand existing patterns in frontend and backend
3. decide whether to align with current pattern or improve it
4. prefer introducing a clean pattern if current pattern is weak
5. implement in small coherent increments
6. validate after each increment
7. document what changed
8. record any important decision or tradeoff

The agent should behave as if the codebase will be handed to another team immediately after the POC.

---

## 5. Required Documentation Discipline

The agent must maintain the following files during implementation.

## 5.1 Required files

### At repo root or shared docs location
- `docs/BANKID_IMPLEMENTATION_PLAN.md`
- `docs/BANKID_AGENT_GUIDE.md`
- `docs/DECISIONS.md`
- `docs/BANKID_FEATURE_NOTES.md`
- `CHANGELOG.md`

### Frontend
- `frontend/bankid-auth-fe/CHANGELOG.md`

### Backend
If backend has its own root changelog, maintain it. Otherwise clearly separate backend entries in root `CHANGELOG.md`.

## 5.2 Documentation rules

### `docs/DECISIONS.md`
Record every significant architectural or behavioral decision.

Each entry should include:
- date
- decision title
- context
- decision taken
- alternatives considered
- consequences

Examples:
- why React Query was chosen
- why QR secret stays server-side
- why order state is abstracted behind store service
- why raw `orderRef` is hidden behind local `orderId`

### `docs/BANKID_FEATURE_NOTES.md`
Record all BankID-specific implementation knowledge that future engineers will need.

Examples:
- mapping of `hintCode` to UI messages
- QR refresh algorithm behavior
- same-device deep link rules
- return URL design decisions
- BankID completion data handling notes
- edge cases discovered during testing
- test environment gotchas
- fallback logic behavior

### `CHANGELOG.md`
Record all meaningful implementation progress.

Each meaningful coding step should result in a changelog update.
Do not wait until the end.

Example categories:
- Added
- Changed
- Fixed
- Docs
- Tests

---

## 6. BankID-Specific Rules the Agent Must Respect

The agent must fully understand BankID behavior before implementation.

The agent must correctly handle:

- `auth`
- `collect`
- `cancel`
- autostart
- animated QR flow
- recommended user messages
- fallback paths
- completion handling
- test environment setup

The agent must treat BankID integration as a backend-owned domain.

### Mandatory BankID behavior expectations

- backend starts the order
- frontend only talks to our backend
- `collect` lifecycle is normalized before UI consumption
- same-device and QR flows are modeled explicitly
- fallback from failed same-device launch to QR is supported
- cancel is supported
- completion data is parsed and validated server-side
- frontend uses normalized DTOs, not raw BankID contracts everywhere

---

## 7. Architecture Rules

## 7.1 Frontend rules

Frontend should follow feature-based structure.

BankID-related code must live under a dedicated feature area, for example:


src/features/auth/


Within the feature, separate:

* API calls
* hooks
* components
* local types
* flow/status mapping

The frontend must not:

* own QR secret generation
* own BankID response interpretation logic beyond presentation
* scatter polling logic across multiple components

Preferred frontend stack:

* React Router data mode already present
* React Query for mutations and polling
* Tailwind for styling
* Zod for validating backend responses if useful

Frontend page behavior should be driven by state, not ad hoc effects spread across components.

## 7.2 Backend rules

Backend must isolate BankID in a dedicated module.

Separate:

* controller layer
* BankID RP API client
* order lifecycle service
* QR generation service
* completion parsing service
* DTOs and mappers

Backend must not:

* mix HTTP transport code with domain mapping in one large file
* embed all logic in controller
* return raw external responses without normalization
* tightly bind in-memory store logic to controller or transport layer

Preferred backend design:

* controller for request/response
* service for orchestration
* client for external BankID calls
* mapper for state translation
* store abstraction for local order tracking

---

## 8. Code Quality Rules

The agent must write code that is:

* strongly typed
* validated at boundaries
* small in function size
* explicit in naming
* minimal in side effects
* consistent in error handling
* consistent in logging

### Naming rules

Use names that describe domain meaning.

Prefer:

* `startAuth`
* `collectOrderStatus`
* `cancelOrder`
* `generateAnimatedQr`
* `mapHintCodeToUserMessage`
* `normalizeCompletionData`

Avoid vague names like:

* `handleData`
* `processResponse`
* `doBankid`
* `helper`

### Function rules

Prefer functions with one clear responsibility.
If a function is difficult to explain in one sentence, split it.

### File rules

Avoid oversized files.
If a file starts becoming responsible for multiple concerns, split it.

---

## 9. State Management Rules

## 9.1 Frontend

Use React Query for:

* starting auth mutation
* polling order status
* cancel mutation

Use local component state only for:

* presentation mode
* selected flow
* ephemeral UI toggles

Do not create unnecessary global state unless there is a clear need.

## 9.2 Backend

Use a dedicated order store abstraction even if in-memory for now.

Reason:

* makes migration to Redis or DB easier
* avoids spreading order state assumptions
* improves testability

---

## 10. Error Handling Rules

The agent must handle errors as a first-class concern.

### Backend

* translate external BankID errors into controlled internal error model
* use consistent HTTP error responses
* avoid leaking internal certificate paths, raw stack traces, or sensitive details
* log detailed internal diagnostics safely
* return frontend-safe error messages

### Frontend

* show actionable user messages
* distinguish:

  * pending informational status
  * recoverable errors
  * terminal failures
* always provide restart path
* provide QR fallback if same-device flow fails or is unavailable

The agent must not leave unhandled promise flows in either frontend or backend.

---

## 11. Security Rules

Even in a POC, the agent must implement secure defaults.

### Must do

* keep certificate handling backend-only
* keep QR secret backend-only
* validate env vars at startup
* validate request DTOs
* validate or parse external BankID responses before trusting them
* mask or minimize personal data in logs
* avoid storing sensitive data in browser localStorage
* use local order ids rather than exposing internal raw identifiers unnecessarily

### Must not do

* log certificate passphrase
* expose `qrStartSecret`
* trust client-provided IP blindly
* use production-like personal data carelessly in test artifacts
* rely on frontend-generated business truth for auth state

---

## 12. Testing Rules

The agent must write tests as implementation progresses, not only at the end.

## 12.1 Backend tests required

* status mapper tests
* QR generation tests
* completion parser tests
* auth start orchestration tests
* cancel handling tests

## 12.2 Frontend tests required

* onboarding page render
* start same-device flow
* start QR flow
* status polling behavior
* success result rendering
* cancel flow behavior
* fallback behavior

## 12.3 Manual verification required

The agent must document manual test outcomes for:

* successful same-device flow
* successful QR flow
* cancellation
* at least one failure/fallback scenario

If live test environment constraints prevent complete manual validation, the agent must explicitly document what was verified and what remains unverified.

---

## 13. Incremental Delivery Rules

The agent should work in phases and keep the application runnable.

Preferred order:

1. documentation scaffolding
2. backend config and BankID client
3. start auth endpoint
4. frontend onboarding actions
5. status polling
6. QR support
7. cancel and fallback
8. completion rendering
9. tests and refinements
10. docs finalization

After each meaningful milestone:

* app should still compile
* key flows should still run
* changelog should be updated
* decisions should be recorded if relevant

---

## 14. Decision-Making Rules

When the agent encounters ambiguity, prefer the option that:

* keeps BankID complexity on backend
* minimizes future refactoring for sign flows
* keeps public contracts clean
* supports testing easily
* avoids security regressions
* uses stable patterns familiar to most engineers

When making a meaningful tradeoff, record it in `docs/DECISIONS.md`.

Examples of decisions that must be recorded:

* in-memory store now vs Redis later
* whether QR is generated server-side as image or as raw text
* whether raw completion data is exposed in POC response
* how return URL is handled
* how mobile device detection is approached
* how status polling cadence is implemented

---

## 15. UX Rules for `/onboarding`

The onboarding page should be clear, minimal, and resilient.

The user should always understand:

* what to do next
* whether BankID started
* whether they should open the app
* whether they should scan QR
* whether something failed
* how to retry or cancel

The agent should:

* prefer explicit action labels
* keep status messaging simple
* avoid technical jargon in user-facing text
* use BankID-style recommended message intent where applicable
* keep result display readable for POC/debugging

The page should support:

* flow selection
* pending state
* QR view
* success result view
* failure view
* cancel and restart actions

---

## 16. Logging and Observability Rules

The agent must add structured logs for backend lifecycle events.

At minimum log:

* auth start requested
* BankID auth started
* collect pending transition
* collect complete transition
* collect failure transition
* cancel requested
* cancel completed
* unexpected external error
* validation failure

Logs should include:

* correlation id
* local order id
* flow type
* state
* safe error metadata

Do not log:

* certificate contents
* passphrases
* full sensitive secrets
* excessive personal data

---

## 17. Refactoring Rules

The agent is allowed to improve surrounding structure when necessary, but must do so carefully.

Allowed:

* reorganizing BankID-related files into cleaner modules
* introducing React Query provider
* introducing shared API client
* introducing config validation
* adding common DTO or mapper structure

Not allowed:

* broad unrelated refactors
* renaming large unrelated app areas without need
* changing unrelated business logic just because it could be improved

Refactor only where it supports the BankID implementation or maintainability of this work.

---

## 18. Dependency Rules

The agent must be conservative with dependencies.

Add a library only if it clearly improves:

* stability
* maintainability
* correctness
* testing
* developer experience without increasing risk unnecessarily

Preferred additions:

* React Query
* Zod
* Nest config support
* structured logging support

Avoid adding:

* niche BankID wrappers of uncertain maintenance
* heavy state libraries unless truly needed
* duplicate utility libraries that solve minor problems

Every new dependency should be justifiable.
If non-obvious, record the reason in `docs/DECISIONS.md`.

---

## 19. Git and Change Tracking Behavior

If working in commits, keep them coherent by concern.

Examples:

* docs scaffolding
* backend BankID client and config
* auth start endpoint
* frontend onboarding integration
* status polling and QR support
* cancel and fallback
* tests and docs refinement

Regardless of commit behavior, changelog updates must reflect real progress.

---

## 20. Required Output Quality Standard

The work is complete only if all of the following are true:

* code is modular
* BankID flow works end to end in POC scope
* frontend `/onboarding` shows status and result
* same-device and QR flows are implemented
* cancel and fallback exist
* tests cover the core logic
* documentation is updated continuously
* decisions are recorded
* special BankID behavior is documented for future engineers

---

## 21. What the Agent Must Persist for Future Reference

The agent must persist knowledge that future contributors would otherwise lose.

At minimum persist:

* BankID environment setup quirks
* certificate setup notes
* endpoint contracts
* status mapping logic
* hintCode interpretation
* QR refresh behavior
* return URL approach
* fallback flow design
* known test limitations
* assumptions made in POC
* deferred production concerns

This information belongs in:

* `docs/BANKID_FEATURE_NOTES.md`
* `docs/DECISIONS.md`
* changelogs where relevant

---

## 22. Expected Engineering Mindset

The agent should act like a senior engineer building the first reliable version of a sensitive authentication integration.

That means:

* think ahead
* keep design clean
* document important logic
* avoid shortcuts that create future migration pain
* optimize for trustworthiness and maintainability

The POC is small in scope, but the architectural foundation matters.
This implementation should be a strong base for the future insurance switching product.
