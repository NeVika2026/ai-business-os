<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

This is a single npm-managed **Next.js 16 / React 19** app ("AI Business OS"). The dirs under `services/` are in-process TypeScript modules, not separate servers. Standard commands live in `package.json` and `docs/guides/DEVELOPER-GUIDE.md` (`npm run dev|lint|build|test`). Tests force `GATEWAY_USE_MOCK=true`, so no LLM provider keys are needed for lint/test/build, and none of those three need Supabase running.

### Services

| Service | Run | Notes |
|---|---|---|
| Next.js dev app | `npm run dev` → http://localhost:3000 | Needs `.env` + local Supabase reachable for any auth-gated page (everything except `/login` and `/api/health`). |
| Local Supabase (Docker) | `supabase start` (from repo root) | Auth + Postgres backend. Applies migrations `001`–`020` (incl. seed). Studio `54323`, Mailpit `54324`. |

### Non-obvious startup caveats

- **Docker is not auto-started** (no systemd in this VM). Start it once per session before Supabase: `sudo dockerd > /tmp/dockerd.log 2>&1 &` then `sudo chmod 666 /var/run/docker.sock`. Docker is configured with the `fuse-overlayfs` storage driver and `containerd-snapshotter` disabled (required for Docker 29 here).
- **Supabase CLI is a two-binary shim** (`supabase` + `supabase-go`); both live in `/opt/supabase-cli` (symlinked into `/usr/local/bin`). They must stay co-located.
- **Grants are required after every `supabase start`.** The migrations enable RLS but never `GRANT` table privileges, and current Supabase no longer auto-exposes new `public` tables (`auto_expose_new_tables` is unset in `supabase/config.toml`). Without grants the app throws Postgres `42501 permission denied` on every dashboard page. After starting Supabase, run:
  ```bash
  docker exec supabase_db_ai-business-os psql -U postgres -d postgres -c \
    "GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated, anon; \
     GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;"
  ```
- **`.env`** (gitignored) must contain the local Supabase URL/keys. Use `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321` with the deterministic local `anon`/`service_role` keys printed by `supabase start` (or `supabase status`), plus `GATEWAY_USE_MOCK=true`.

### Auth / login (for end-to-end testing)

- Login is **passwordless magic-link** (`signInWithOtp`), not password. Seed users: `user_a@demo.local` (owns "Demo Org A" with CRM/projects/etc.) and `user_b@demo.local`.
- To log in: submit the email on `/login`, then open the captured email in **Mailpit (http://localhost:54324)** and follow its magic link (it hits `/auth/callback?code=...`). Email sending is rate-limited to **2/hour** per the Supabase config, so don't spam logins.
