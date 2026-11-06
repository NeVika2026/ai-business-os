# Commerce security contract

This document accompanies `commerce-schema.sql`. It is intentionally not a production migration yet.

## Trust boundaries

The browser can read the published catalog and the signed-in user's own order/payment/entitlement views. It cannot write payment status, entitlements, seller balances or webhook events.

Tochka webhooks are untrusted until their RS256 signature is verified with Tochka's public OpenAPI key. The event status is then classified; only `APPROVED` may transition an order to paid and create an entitlement. `AUTHORIZED` is a hold for two-stage card payment and must remain pending.

## Idempotency

`paymentLinkId` is the Business Factory order identifier sent to Tochka and must be unique. Provider operation IDs are unique per provider. Every persisted webhook needs a deterministic `provider_event_id` (prefer a native event id when present; otherwise derive one from operation id + status + immutable event timestamp/data) and a SHA-256 payload digest. The unique constraints make a duplicate delivery a no-op.

The transaction that handles an APPROVED event must atomically:
1. insert/claim the payment event;
2. update the payment;
3. update the order;
4. insert the entitlement with its unique key;
5. insert the seller ledger sale entry;
6. enqueue contract/notification work.

If step 1 conflicts because the event already exists, return HTTP 200 without repeating steps 2–6.

## Money

All internal amounts are integer kopecks. Platform commission is frozen in basis points and kopecks on the order. The invariant is `platform_fee_kopecks + seller_net_kopecks = sale_price_kopecks`.

## Admin and seller controls

Seller-facing write policies are deliberately absent from the initial schema. Product authoring, price changes, refunds and payouts need explicit server actions with authorization. Money-changing admin operations should require MFA/AAL2, and role decisions must never trust user-editable `user_metadata`.

## Production apply checklist

1. Restore/verify Supabase database connectivity and inspect existing public tables.
2. Check whether the Data API exposes `public` and review grants.
3. Convert this contract into a real migration after comparing names with existing schema.
4. Apply to a development branch first.
5. Test RLS as anon, buyer A, buyer B, seller and admin.
6. Run Supabase Security Advisor and fix every commerce-related finding.
7. Generate TypeScript database types.
8. Only then enable live checkout/webhook persistence.
