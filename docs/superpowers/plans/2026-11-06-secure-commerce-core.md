# Secure Commerce Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a secure, testable first commercial layer to Business Factory: genuine 24-hour welcome pricing, protected commerce routes, and a cabinet entry point.

**Architecture:** Keep Next.js App Router with Supabase SSR auth. Put pricing/time logic in a pure utility with tests, render the offer server-side from the authenticated user's creation timestamp, and protect the new commerce route prefixes in `proxy.ts`. Payment and marketplace settlement remain separate phases.

**Tech Stack:** Next.js 16, React 19, TypeScript, Supabase Auth, Vercel, node:test via tsx.

**Spec:** `docs/superpowers/specs/2026-11-06-secure-commerce-core-design.md`

## Global Constraints
- Existing Business Factory internal routes must not break.
- Welcome timer must be real and account-based; no reset on reload.
- No payment-success state is fabricated before Toсhka webhook integration exists.
- Security checks must run in CI.

## Review Focus
- User account created more than 24 hours ago receives no welcome discount.
- User account created in the future does not create a negative elapsed-time exploit.
- Direct visit to protected commerce route while signed out redirects to login.
- Price calculation never returns a negative price.
- CI includes the existing full test command before build.

---

### Task 1: Welcome offer engine

**Files:**
- Create: `tests/commerce/welcome-offer.test.ts`
- Create: `utils/commerce/welcome-offer.ts`

**Interfaces:**
- Produces: `getWelcomeOffer(createdAt, now, regularPrice, welcomePrice)`

- [ ] **Step 1: Write failing tests** for active, expired, future-created and invalid price cases.
- [ ] **Step 2: Run `npm test -- tests/commerce/welcome-offer.test.ts` and verify failure because the utility does not exist.**
- [ ] **Step 3: Implement the minimal pure utility.**
- [ ] **Step 4: Run the focused test and then `npm test`.**
- [ ] **Step 5: Commit.**

### Task 2: Protected welcome-offer page

**Files:**
- Create: `app/cabinet/offers/page.tsx`
- Create: `components/commerce/WelcomeOfferCard.tsx`
- Modify: `proxy.ts`

**Interfaces:**
- Consumes: `getWelcomeOffer(...)`
- Produces: authenticated page at `/cabinet/offers`

- [ ] **Step 1: Add route-security test covering `/cabinet`.**
- [ ] **Step 2: Verify it fails before proxy change.**
- [ ] **Step 3: Protect commerce prefixes and render account-based offer.**
- [ ] **Step 4: Run tests and build.**
- [ ] **Step 5: Commit.**

### Task 3: CI security gate

**Files:**
- Modify: `.github/workflows/security-build.yml`

**Interfaces:**
- Produces: test → lint → npm audit → security audit → build gate.

- [ ] **Step 1: Add `npm test` before lint/build.**
- [ ] **Step 2: Verify workflow syntax through a production build/deployment and GitHub status if available.**
- [ ] **Step 3: Commit and verify Vercel deployment.**
