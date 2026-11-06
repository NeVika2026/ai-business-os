# Commerce Transaction Core — Design

## Intent
Build the secure transaction foundation for Business Factory without pretending that payments are live before Tochka credentials and database connectivity are verified.

## Transaction rules
- Money is stored as integer kopecks. No floating-point money math.
- Every order freezes a commercial snapshot: product, offer, price, discount, platform fee, seller net and legal/offer version.
- A buyer receives entitlement only after a verified payment reaches status APPROVED.
- Tochka status AUTHORIZED does not grant access.
- Webhook processing is idempotent: duplicate delivery cannot create a second entitlement, contract, commission or notification.
- Each Tochka payment uses a unique paymentLinkId/order number.
- Refund state is preserved; payout logic is separate and cannot be inferred from gross sales.
- Marketplace commission is frozen at purchase time in basis points.

## Data model
Products -> Offers -> Orders -> Order Items -> Payments -> Payment Events -> Entitlements -> Seller Ledger.
Contracts and notifications reference the order/payment event but are not the source of truth for payment status.

## Security
- Browser code never receives Tochka tokens or Supabase secret/service keys.
- Public catalog may be read by anonymous visitors; orders, payments and entitlements are private.
- Payment events and ledger mutations are server-only.
- All exposed Supabase tables use RLS.
- Admin/money mutations will require MFA/AAL2 in the database policy or server operation once the live DB layer is enabled.
- Webhooks must verify Tochka RS256 signature before trusting payload data.

## Tochka integration
Current official API: create payment link with POST /uapi/acquiring/v1.0/payments; paymentLinkId is a unique order identifier. acquiringInternetPayment webhooks are text/plain JWT signed RS256. Only APPROVED is treated as paid. AUTHORIZED means funds are only held for two-stage card payments.

## Current infrastructure constraint
The connected Supabase project is ACTIVE_HEALTHY but database MCP queries currently terminate by timeout. Therefore this phase commits the schema contract and application transaction core, but does not apply destructive or unverified DDL to production. No UI may claim a payment succeeded until the verified DB-backed webhook path is enabled.
