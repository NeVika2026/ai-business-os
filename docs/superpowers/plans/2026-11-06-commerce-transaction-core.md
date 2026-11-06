# Commerce Transaction Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a secure, testable order/payment domain, Tochka payment-link adapter, verified webhook parser, and RLS-ready database contract without falsely enabling live payments.

**Architecture:** Pure commerce logic handles money snapshots and payment transitions. Server-only Tochka code creates payment requests and verifies RS256 webhook JWTs. A database contract documents tables, unique constraints and RLS; live DDL waits for a verified Supabase connection.

**Tech Stack:** Next.js 16, TypeScript, node:test, Node crypto, Supabase, Tochka API.

**Spec:** `docs/superpowers/specs/2026-11-06-commerce-transaction-core-design.md`

## Global Constraints
- Money uses integer kopecks.
- APPROVED is the only payment status that grants access.
- AUTHORIZED never grants access.
- Duplicate webhook delivery must be idempotent.
- No Tochka token or Supabase secret may appear in browser code.
- No production DDL is applied while Supabase MCP database queries time out.

## Review Focus
- Platform fee rounding cannot create or destroy kopecks.
- Invalid or negative money values are rejected.
- A forged/modified JWT fails verification.
- A valid JWT with AUTHORIZED does not produce a paid transition.
- Duplicate APPROVED event is represented as an idempotent no-op at the persistence contract boundary.

---

### Task 1: Order quote snapshot
**Files:** create `tests/commerce/order-quote.test.ts`, `utils/commerce/order-quote.ts`.
**Produces:** `createOrderQuote(input)`.
- [ ] Write failing tests for fee math, discount, invalid amounts and basis-point bounds.
- [ ] Implement integer-only snapshot math.
- [ ] Run focused test and full suite.
- [ ] Commit.

### Task 2: Tochka payment-link request builder
**Files:** create `tests/commerce/tochka-payment.test.ts`, `services/payments/tochka.ts`.
**Produces:** `buildTochkaPaymentRequest`, `createTochkaPaymentLink`.
- [ ] Write failing tests for unique paymentLinkId, ruble formatting and server-only config validation.
- [ ] Implement official request shape and response validation.
- [ ] Run focused test and full suite.
- [ ] Commit.

### Task 3: RS256 webhook verification and state classification
**Files:** create `tests/commerce/tochka-webhook.test.ts`, `services/payments/tochka-webhook.ts`.
**Produces:** `verifyTochkaWebhookJwt`, `classifyTochkaPaymentStatus`.
- [ ] Write failing tests using an ephemeral RSA key pair.
- [ ] Implement JWT signature verification and APPROVED/AUTHORIZED classification.
- [ ] Run focused test and full suite.
- [ ] Commit.

### Task 4: RLS-ready persistence contract
**Files:** create `docs/architecture/commerce-schema.sql`, `docs/architecture/commerce-security.md`.
**Produces:** reviewed SQL contract for products, offers, orders, items, payments, events, entitlements and seller ledger.
- [ ] Encode unique/idempotency constraints and RLS policies.
- [ ] Keep payment/ledger writes server-only.
- [ ] Document production-apply prerequisites and advisor checks.
- [ ] Commit.

### Task 5: Checkout readiness API
**Files:** create `app/api/commerce/readiness/route.ts`, tests for configuration helper.
**Produces:** a non-secret readiness response that says whether live checkout can be enabled, without exposing credentials.
- [ ] Test configured/unconfigured states.
- [ ] Implement server-only env checks.
- [ ] Build and verify.
- [ ] Commit.
