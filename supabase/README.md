# Supabase (hosted)

ClipMax uses a hosted Supabase project for local development and production. There is no local
Supabase stack and no `supabase start`.

## First-time link

```powershell
pnpm dlx supabase login
pnpm dlx supabase link --project-ref <your-project-ref>
```

## Migration workflow

Apply the files in `supabase/migrations` in date order:

1. `20261023120000_init.sql` — tables, RLS, credit functions, queue.
2. `20261024180000_credit_reservations.sql` — per-reservation settle/refund idempotency.
3. `20261024182000_billing.sql` — pending/paused/completed subscription states and lookup index.
4. `20261024190000_rate_limits.sql` — fixed-window API rate limits, service-role only.
5. `20261024191000_free_plan_renewal.sql` — idempotent monthly free-plan grant.
6. `20261025120000_hardening.sql` — atomic project/retry RPCs, checkout serialization, ordered
   subscription events, webhook claim/retry, and worker ownership checks.
7. `20261026120000_backend_hardening.sql` — lease reaper that fails at max attempts, terminal
   failure cleanup and sibling-job stop, checkout stale/clear/reconcile RPCs, and per-user checkout
   serialization. **Apply this before deploying the matching web/worker code.**

Verify the migration chain without a hosted project or Docker:

```powershell
pnpm db:verify   # PGlite; applies every migration and checks RLS, credits, renewal, rate limits
```

Then apply migrations to the linked remote project:

```powershell
pnpm db:push

# regenerate the TypeScript schema after a migration
pnpm db:types
```

Do not add a local `config.toml`; project-level auth, storage, and database settings are managed in
the Supabase dashboard for the hosted project. Enable the email and Google providers, and add
`http://localhost:3200/auth/callback` plus the production callback to the redirect allow list.
