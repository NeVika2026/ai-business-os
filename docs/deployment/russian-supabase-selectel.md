# Russian data-residency deployment for AI Business Factory

## Goal

Move the user-data plane from hosted Supabase EU to a self-hosted Supabase stack running on infrastructure physically located in Russia, while keeping the current Next.js application and Supabase client API shape.

This document is an operational plan, not proof of legal compliance by itself. Before production traffic, confirm the provider contract, physical region, backups, support access and any cross-border subprocessors.

## Target architecture

- Frontend: Vercel / Next.js may remain as the public web layer.
- Personal-data API/Auth/DB: self-hosted Supabase on a Russian server.
- PostgreSQL: inside the same Russian deployment unless a separately managed Russian PostgreSQL is deliberately configured and tested.
- Storage: Russian S3-compatible storage or local Supabase Storage, depending on the final provider setup.
- Payments: Tochka calls the server-side Next.js API; the verified webhook updates only the Russian data plane.
- European hosted Supabase must not remain the production primary store for Russian personal data.

## Capacity baseline

Current Supabase self-hosting guidance lists:

- minimum: 2 CPU / 4 GB RAM / 40 GB SSD;
- recommended for small-to-medium production: 4 CPU / 8 GB+ RAM / 80 GB+ SSD.

Use the recommended size for launch. Do not enable optional Logs/Analytics until required, because they increase resource usage.

## Provisioning checklist

1. Create a Linux server in a Russian availability region with at least 4 vCPU, 8 GB RAM and 80 GB SSD.
2. Restrict inbound firewall rules:
   - 22/tcp only from administrator IP/VPN;
   - 443/tcp public;
   - do not expose PostgreSQL 5432/6543 publicly;
   - do not expose Kong port 8000 directly after HTTPS proxy is configured.
3. Create DNS for a dedicated backend hostname, for example:
   - `db.business-zavod.ru`
4. Install Docker Engine, Docker Compose, Git, OpenSSL and jq.
5. Fetch the official Supabase Docker stack using the current official setup path.
6. Generate fresh secrets and asymmetric auth keys on the server.
7. Configure:
   - `SUPABASE_PUBLIC_URL=https://db.business-zavod.ru`
   - `API_EXTERNAL_URL=https://db.business-zavod.ru`
   - `SITE_URL=https://business-zavod.vercel.app` until a custom frontend domain is final
8. Put Nginx or Caddy in front of Supabase and terminate TLS on 443.
9. Keep Studio protected with a strong generated dashboard password and restrict Studio access by firewall/VPN if practical.
10. Start the stack and require all containers to report healthy.

## Application environment

Only after the Russian stack is healthy, change the application configuration:

- `NEXT_PUBLIC_SUPABASE_URL=https://db.business-zavod.ru`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=<new publishable key>`
- `SUPABASE_SECRET_KEY=<new server-only secret key>`
- `DATA_RESIDENCY_REGION=RU`

Never expose `SUPABASE_SECRET_KEY` through a `NEXT_PUBLIC_` variable.

## Migration sequence

1. Freeze schema changes on the old hosted project.
2. Export schema and data required by AI Business Factory.
3. Do not blindly copy old security warnings.
4. Apply the application schema to the Russian database.
5. Apply the commerce schema and RLS policies.
6. Recreate Auth configuration and redirect URLs.
7. Migrate users with the safest supported Auth migration path; if password hashes cannot be migrated safely, use a forced password-reset flow.
8. Migrate Storage objects only after bucket access rules are recreated.
9. Verify RLS with four personas:
   - anonymous;
   - buyer A;
   - buyer B;
   - seller/admin.
10. Run security checks before switching traffic.
11. Change Vercel environment variables to the Russian endpoint.
12. Deploy preview, verify, then production.
13. Disable production writes to the old EU Supabase.
14. Retain the old system only for the minimum rollback window, then remove personal data according to the retention policy.

## Commerce release gate

Checkout and webhook processing must stay disabled unless all of these are true:

- Russian data-residency gate is green;
- Supabase server secret is configured;
- Tochka API token and customer code are configured;
- Tochka public key is configured;
- commerce tables and RLS are present;
- webhook signature verification is enabled;
- only `APPROVED` grants entitlement;
- duplicate events are idempotent;
- Security Advisor / equivalent review has no unresolved critical commerce finding.

## Security requirements

- SSH key authentication only; disable password login.
- Automatic security updates for the host OS.
- Daily encrypted backups stored in Russia.
- Backup restore test before launch.
- TLS everywhere.
- No public database ports.
- No default Supabase secrets.
- No secret keys in GitHub, browser bundles or public logs.
- Admin access protected with MFA.
- Audit money-changing actions.
- Rate-limit auth and payment endpoints.
- Keep images pinned to tested Supabase self-hosted releases; upgrade only after preview testing.

## Current blocker

A Russian cloud server/account still has to be provisioned. There is no connected Selectel management integration in this ChatGPT environment, so purchasing or creating the paid infrastructure cannot be performed here without the provider account/action surface. All repository-side preparation can continue independently.
