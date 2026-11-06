# Secure Commerce Core — Design

## Intent
Turn Business Factory into a secure web/PWA platform where a registered user can start with free tools, see a genuine 24-hour welcome offer, move into paid products, and later attach payments, contracts, marketplace commissions and author payouts without rebuilding the foundation.

## Goals
- Keep the existing Next.js + Supabase + Vercel stack.
- Make the first commercial mechanics real now: protected cabinet, deterministic welcome pricing, product catalog, and secure route boundaries.
- Never use a fake/resetting countdown. Welcome eligibility is derived from the authenticated account creation time.
- Keep all money-changing actions server-side when payment integration is added.
- Preserve the existing internal Business Factory routes.

## Non-goals for this phase
- Charging a card or recurring subscription.
- Crediting marketplace authors or making payouts.
- Applying database schema changes while the connected Supabase database is unreachable.
- Claiming a signed contract before payment/webhook integration is completed.

## Security
- Protected commerce routes require a verified Supabase user.
- No service-role key in client code.
- Security headers remain enabled.
- CI must run tests, lint, security audit and build.
- Later database work must use RLS on every exposed table and MFA for admin/money operations.

## UX
- Public entry points: Free, Marketplace, Courses, Exit to Money.
- Registered users receive a 24-hour welcome offer based on auth.created_at.
- Example price anchor: 2,990 ₽ regular → 1,490 ₽ during welcome window.
- Expired welcome offers never restart for the same account.
