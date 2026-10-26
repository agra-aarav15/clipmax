# ClipMax Deployment Runbook

Status: written 24 Oct 2026; updated 26 Oct 2026. Hosted Supabase exists and is verified; R2,
Razorpay, the production host, and the domain are still missing. This is the credential-backed path
from `F:\ClipMax` to a working production URL.

Read this with `CLIPMAX.md` §7 (definition of done) and `HANDOFF.md`. Do not mark a step done because
a command exited 0 — use the stated check for each step.

---

## 0. Go / no-go gates

Launch only when all of these are true:

- [ ] A new account signs up with Google **and** email on the production domain.
- [ ] A real 2–5 minute source uploads directly to R2 (no browser → Next.js video bytes).
- [ ] The worker claims the job, transcribes, selects 3–5 highlights, renders with burned captions,
      and publishes playable clips.
- [ ] Download serves a real MP4 with a 60-minute signed URL.
- [ ] A Razorpay **test** payment grants exactly 150 credits once; replaying the webhook grants 0.
- [ ] `/api/health` returns `ready: true` and `/healthz` returns `media_ready: true`.
- [ ] Rate-limit migration is applied; a 31st presign in an hour returns 429.
- [ ] Free-plan renewal runs once and is idempotent on a second call.
- [ ] Landing, signup, dashboard, results, billing, settings, and error states pass at 390 / 768 /
      1440 px in **both light and dark**.
- [ ] The chosen frontend direction is built, no fake data is presented as real, and every sample is
      visibly labelled.
- [ ] The static GitHub Pages preview still builds under `/clipmax`.
- [ ] `./scripts/verify.ps1` is green on the deployed commit (it includes `pnpm db:verify`).

If any payment or auth check cannot run, launch with billing explicitly unavailable and a waitlist.
Never simulate a successful charge.

---

## 1. Decisions to record before provisioning

| Decision        | Needed value                                   | Why                                  |
| --------------- | ---------------------------------------------- | ------------------------------------ |
| Apex domain     | e.g. `clipmax.app`                             | Auth redirects, CORS, cookies        |
| Web host        | Vercel **or** a Node host with `pnpm start`    | `/auth/callback`, API routes, cron   |
| Worker host     | Linux VM, 4 vCPU / 8 GB RAM minimum for FFmpeg | Long-lived claim loop, system FFmpeg |
| Supabase region | closest to the worker                          | DB latency during render             |
| R2 location     | automatic (or closest to the worker)           | source upload and clip delivery      |
| Support inbox   | real monitored address                         | billing failures, data deletion      |

Write these into `CLIPMAX.md` §5 and §9 when chosen. `vercel.json` is intentionally not committed
because the web host is still open; configure the cron in the chosen host's dashboard (§6).

---

## 2. Environment matrix

Never commit `.env`, `apps/web/.env.local`, or `apps/worker/.env`. The repo ignores all three.

| Variable                           | Web | Worker | Notes                                                           |
| ---------------------------------- | :-: | :----: | --------------------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL`              |  ✓  |        | Public origin, no trailing slash. Must match auth redirects.    |
| `NEXT_PUBLIC_SUPABASE_URL`         |  ✓  |        | Inlined at build time; set it before `pnpm build`.              |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`    |  ✓  |        | Public by design; RLS still applies.                            |
| `SUPABASE_URL`                     |  ✓  |   ✓    | Server-only value used by the service-role client.              |
| `SUPABASE_SERVICE_ROLE_KEY`        |  ✓  |   ✓    | Bypasses RLS. Server only. Never prefix with `NEXT_PUBLIC_`.    |
| `R2_ACCOUNT_ID`                    |  ✓  |   ✓    | Endpoint is derived when `R2_ENDPOINT` is empty.                |
| `R2_ACCESS_KEY_ID`                 |  ✓  |   ✓    | S3 API token, scoped to the one bucket.                         |
| `R2_SECRET_ACCESS_KEY`             |  ✓  |   ✓    | Shown once by Cloudflare.                                       |
| `R2_BUCKET`                        |  ✓  |   ✓    | Private bucket, e.g. `clipmax`.                                 |
| `R2_ENDPOINT`                      |  ✓  |   ✓    | Optional; leave empty to derive from the account id.            |
| `RAZORPAY_KEY_ID`                  |  ✓  |        | `rzp_test_…` puts the UI in test mode.                          |
| `RAZORPAY_KEY_SECRET`              |  ✓  |        | Used for checkout signature verification only.                  |
| `RAZORPAY_WEBHOOK_SECRET`          |  ✓  |        | Separate from the key secret.                                   |
| `RAZORPAY_PLAN_STARTER_MONTHLY`    |  ✓  |        | Plan id, not the amount.                                        |
| `CRON_SECRET`                      |  ✓  |        | 32+ random bytes. Authenticates `/api/cron/renew-free-credits`. |
| `WHISPER_PROVIDER`                 |     |   ✓    | `openai`, `groq`, or `local`.                                   |
| `OPENAI_API_KEY` / `GROQ_API_KEY`  |     |   ✓    | Required for the selected hosted transcription provider.        |
| `LLM_PROVIDER` / `LLM_API_KEY`     |     |   ✓    | Without a key, highlights use the labelled heuristic.           |
| `WORKER_ID`                        |     |   ✓    | Unique per process, e.g. `vm-1`.                                |
| `WORKER_CONCURRENCY`               |     |   ✓    | Start at 1 until render timings are known.                      |
| `FFMPEG_BINARY` / `FFPROBE_BINARY` |     |   ✓    | Defaults are fine when they are on `PATH`.                      |
| `TEMP_DIR`                         |     |   ✓    | Fast local disk with room for 500 MB sources and renders.       |

Generate the cron secret:

```bash
openssl rand -hex 32
```

`apps/web/src/lib/env.ts` treats empty strings as unset, so copying the template and filling only
some values is safe. Production boot logs missing required groups; `/api/health` returns 503 and
`ready: false` until Supabase and R2 are complete.

---

## 3. Supabase

1. Create a project in the region chosen above. Save the project URL, anon key, and service-role key.
2. Link and apply migrations from the repository root:

   ```bash
   pnpm db:verify        # offline check: all migrations + RLS/credits/rate limits
   pnpm dlx supabase login
   pnpm db:link          # project ref
   pnpm db:push          # applies supabase/migrations in timestamp order
   ```

   Expected migrations, all applied without error:

   ```
   20261023120000_init.sql
   20261024180000_credit_reservations.sql
   20261024182000_billing.sql
   20261024190000_rate_limits.sql
   20261024191000_free_plan_renewal.sql
   20261025120000_hardening.sql
   ```

3. In **Authentication → URL Configuration**:

   - Site URL: `https://<domain>`
   - Redirect URLs: `https://<domain>/auth/callback`, `http://localhost:3200/auth/callback`
   - Use `localhost`, not `127.0.0.1`, for local auth.

4. Enable **Email** (magic link) and **Google**. For Google, add the Supabase callback URL shown in
   the dashboard to the Google OAuth client, then paste the client id/secret into Supabase.
5. Set the magic-link email template to use `{{ .ConfirmationURL }}` and a real sender. Test both
   providers on the production domain.
6. Verify the schema from the SQL editor:

   ```sql
   select proname from pg_proc
   where proname in (
     'consume_rate_limit',
     'renew_free_plan_credits',
     'begin_checkout',
     'attach_checkout_subscription',
     'claim_webhook_event',
     'apply_subscription_event',
     'heartbeat_job',
     'finish_render_job',
     'fail_job'
   )
   order by proname;
   -- expect all nine rows
   ```

7. Confirm RLS is on for every tenant table:

   ```sql
   select relname, relrowsecurity from pg_class
   where relnamespace = 'public'::regnamespace and relkind = 'r'
   order by relname;
   ```

8. Before launch, enable PITR/backups and record the retention window in this file.

The migrations are additive. There is no down migration; restore from PITR for a bad data change.

---

## 4. Cloudflare R2

1. Create a **private** bucket, e.g. `clipmax`. Do not enable public access or a custom domain.
2. Create an S3 API token limited to that bucket with Object Read & Write.
3. Add a CORS policy for the browser upload and signed reads:

   ```json
   [
     {
       "AllowedOrigins": ["https://<domain>", "http://localhost:3200"],
       "AllowedMethods": ["GET", "PUT", "HEAD"],
       "AllowedHeaders": ["*"],
       "ExposeHeaders": ["ETag"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```

   `PUT` is the direct upload; `GET`/`HEAD` cover playback, download, and verification. Restrict
   `AllowedOrigins` to real origins — do not use `*` in production.

4. Add a lifecycle rule to expire incomplete multipart uploads after 7 days. Sources and renders
   are deleted by the app when a project is deleted; abandoned `uploading` rows are a cleanup job,
   not a lifecycle rule, because the object is a complete single PUT.
5. Test with a small file using the app, not with a public URL.

---

## 5. Razorpay

1. Complete KYC for live mode. Until then, use test keys and keep the UI honest: checkout shows a
   test-mode badge from `RAZORPAY_KEY_ID`.
2. Create a **monthly subscription plan** for ₹1,499 / $19 equivalent and copy its `plan_…` id into
   `RAZORPAY_PLAN_STARTER_MONTHLY`.
3. Create an API key. Put the key id and secret in the web environment only.
4. Add a webhook:

   - URL: `https://<domain>/api/webhooks/razorpay`
   - Secret: a new random value, stored as `RAZORPAY_WEBHOOK_SECRET`
   - Events: `subscription.authenticated`, `subscription.activated`, `subscription.charged`,
     `subscription.pending`, `subscription.halted`, `subscription.paused`, `subscription.resumed`,
     `subscription.cancelled`, `subscription.completed`
   - Active: yes

5. Test checkout in test mode. Expected sequence:

   - `POST /api/billing/checkout` stores `provider_subscription_id` with status `pending`.
   - Checkout returns `razorpay_signature`; `/api/billing/verify` accepts it and reports
     `granted: false` until the webhook lands.
   - `subscription.charged` sets status `active`, plan `starter`, and grants 150 credits once.
   - The billing page shows the real ledger row and the next period end.

6. Replay the same webhook from the Razorpay dashboard. Expected: HTTP 200, `granted` credits stay
   at 150, and `webhook_events` has one row for the event id. A duplicate charge with a new payment
   id is a new grant by design (one grant per paid cycle).

7. Test a failed/cancelled subscription and confirm the profile returns to `free` only on
   `cancelled`/`completed`, not on a stale `authenticated` event.

---

## 6. Web deployment

### Option A — Vercel

1. Import the repository. Set **Root Directory** to `apps/web` and keep the pnpm workspace install
   (Vercel detects the root lockfile). Build command: `pnpm build`.
2. Add every web variable from §2 to Production and Preview. Add the same
   `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` to the build environment — they are
   inlined at build time.
3. Add the production domain, then update Supabase redirect URLs and R2 CORS to the final origin.
4. Add a Cron Job in the project dashboard (or a root `vercel.json` if the project root is the repo
   root): path `/api/cron/renew-free-credits`, schedule `0 2 1 * *`. Vercel sends
   `Authorization: Bearer $CRON_SECRET` automatically when the variable exists.
5. Confirm `/api/health` returns 200 and `ready: true`, and `/api/health` is not cached.

### Option B — native Node host

```bash
pnpm install --frozen-lockfile
pnpm --filter @clipmax/web build
pnpm --filter @clipmax/web start   # binds 3000 by default; put a TLS proxy in front
```

Run it under systemd or the host's process manager, with the environment from a protected file.
Add a system cron entry:

```cron
0 2 1 * * curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://<domain>/api/cron/renew-free-credits
```

### Cron behavior

- No `CRON_SECRET` → 503 and no grants.
- Wrong/missing bearer → 401.
- First run in a month grants 30 credits to free accounts created before the month began.
- A second run in the same month returns `granted: 0`. Safe to retry at any time.

---

## 7. Worker deployment (Linux VM)

1. Create an unprivileged user and directories:

   ```bash
   sudo useradd --system --create-home --shell /usr/sbin/nologin clipmax
   sudo mkdir -p /opt/clipmax /etc/clipmax /var/lib/clipmax/tmp
   sudo chown -R clipmax:clipmax /opt/clipmax /var/lib/clipmax
   sudo chmod 700 /etc/clipmax
   ```

2. Install Python 3.12, `uv`, and FFmpeg with libass:

   ```bash
   sudo apt-get update
   sudo apt-get install -y python3.12 python3.12-venv ffmpeg
   ffmpeg -hide_banner -filters | grep -w ass
   ffprobe -version | head -1
   ```

   The `ass` filter must be present. If it is missing, captions will not burn in; use a build with
   libass rather than shipping a silent failure.

3. Deploy source and sync the environment:

   ```bash
   sudo -u clipmax git clone <repo> /opt/clipmax/app
   cd /opt/clipmax/app/apps/worker
   sudo -u clipmax uv sync --frozen
   ```

4. Write `/etc/clipmax/worker.env` with the worker variables from §2 (`ENVIRONMENT=production`,
   unique `WORKER_ID`, `TEMP_DIR=/var/lib/clipmax/tmp`). `chmod 600`, owner `root:clipmax`.

5. Install the unit:

   ```ini
   [Unit]
   Description=ClipMax worker
   After=network-online.target
   Wants=network-online.target

   [Service]
   Type=simple
   User=clipmax
   Group=clipmax
   WorkingDirectory=/opt/clipmax/app/apps/worker
   EnvironmentFile=/etc/clipmax/worker.env
   ExecStart=/opt/clipmax/app/apps/worker/.venv/bin/uvicorn clipmax_worker.service:app --host 127.0.0.1 --port 8080
   Restart=always
   RestartSec=5
   NoNewPrivileges=true
   PrivateTmp=true
   ProtectSystem=strict
   ProtectHome=true
   ReadWritePaths=/var/lib/clipmax

   [Install]
   WantedBy=multi-user.target
   ```

   `PrivateTmp=true` plus `TEMP_DIR` keeps renders isolated. If the worker needs the public internet
   for transcription and R2, leave out network restrictions; otherwise add only the required hosts.

6. Start and verify:

   ```bash
   sudo systemctl enable --now clipmax-worker
   curl -fsS http://127.0.0.1:8080/healthz | jq
   ```

   Expected: `status: ok`, `media_ready: true`, FFmpeg and libass reported. The health endpoint does
   not require credentials.

7. Watch the first real job:

   ```bash
   journalctl -u clipmax-worker -f -o cat | jq -c 'select(.job_id != null)'
   ```

   Progress is written to `processing_jobs`; the studio polls every 5 seconds while active.

8. Run a second process with a different `WORKER_ID` only after the first job's peak memory is
   measured. The database claim guarantees one worker per job, but FFmpeg is memory-hungry.

---

## 8. End-to-end smoke pass

Use a fresh account and a real 2–5 minute landscape video with speech.

1. Sign up with Google, then sign out and sign in with an email magic link.
2. Confirm `/dashboard` shows 30 credits and an empty project list.
3. Upload the video. Watch the browser → R2 progress bar, then “Preparing…”.
4. Confirm the project appears and the worker log shows claim → download → probe → transcribe.
5. Wait for 3–5 clips. Each must play in the browser, show burned word-level captions, and have a
   hook and score.
6. Download one clip and probe it locally:

   ```bash
   ffprobe -v error -select_streams v:0 \
     -show_entries stream=width,height,codec_name,pix_fmt \
     -of default=noprint_wrappers=1 downloaded.mp4
   # expect width=1080 height=1920 codec_name=h264
   ```

7. Open the transcript disclosure; confirm the text matches the audio.
8. Delete the project; confirm the row and R2 objects are gone.
9. With a second account, request the first account's project id directly. Expect 404, not data.
10. Open billing, start test checkout, pay with a Razorpay test card, and confirm exactly 150 credits
    appear once. Replay the webhook and confirm no second grant.
11. Hit `/api/uploads/presign` 31 times within an hour with one session; the 31st must return 429
    with `RATE_LIMITED`.
12. Run the monthly renewal by hand:

    ```bash
    curl -fsS -H "Authorization: Bearer $CRON_SECRET" \
      https://<domain>/api/cron/renew-free-credits
    # {"ok":true,"granted":0,...} on the second run in the same month
    ```

13. Resize the browser to 390, 768, and 1440 px. No horizontal scroll, every CTA reachable, no
    clipped headings, focus rings visible.

Record the date, commit SHA, and operator in this file when the pass is green.

---

## 9. Monitoring and operations

- **Web health:** poll `https://<domain>/api/health` every minute; alert on non-200 or
  `ready: false`. It reports configuration groups, not secret values.
- **Worker health:** poll `http://127.0.0.1:8080/healthz` from the host; alert on non-200 or
  `media_ready: false`.
- **Queue depth:** alert when `processing_jobs` has queued rows older than 10 minutes:

  ```sql
  select count(*) from public.processing_jobs
  where status = 'queued' and available_at < now() - interval '10 minutes';
  ```

- **Stuck leases:** `claim_next_job` reclaims expired leases automatically. If a job fails three
  times, it is marked failed and credits are refunded.
- **Webhook failures:** check `webhook_events` for gaps and the host logs for
  `[razorpay webhook] processing failed`. Razorpay retries; the grant is idempotent.
- **Rate limiter:** if `rate_limit_windows` grows unexpectedly, confirm the 1% cleanup path runs.
  The table is service-role only.

---

## 10. Rollback

| Failure                         | Action                                                                                     |
| ------------------------------- | ------------------------------------------------------------------------------------------ |
| Bad web deploy                  | Promote the previous deployment (Vercel) or check out the previous SHA and restart.        |
| Bad worker deploy               | `git checkout <previous-sha>` in `/opt/clipmax/app`, `uv sync --frozen`, restart the unit. |
| Runaway renders / cost incident | `systemctl stop clipmax-worker`. Queued jobs stay queued; no credits are consumed.         |
| Payment webhook misbehaving     | Disable the webhook in Razorpay, keep the site up, and reconcile from the Razorpay ledger. |
| Bad migration                   | Migrations are additive. Restore the project from PITR to a new project, then repoint env. |
| Leaked service-role key         | Rotate it in Supabase, update web and worker env, restart both. Audit `credit_ledger`.     |
| Leaked R2 token                 | Revoke the token in Cloudflare, issue a new one, update both env files, restart.           |
| Leaked Razorpay key secret      | Rotate in Razorpay, update the web env, redeploy. Verify no unexpected subscriptions.      |

There is no automated rollback for data deletion. Take a manual backup before any cleanup that
touches `projects`, `clips`, or `credit_ledger`.

---

## 11. Post-launch checklist

- [ ] Record the commit SHA, deploy time, and operator here.
- [ ] Confirm backups and the restore drill date.
- [ ] Confirm support inbox and data-deletion path are monitored.
- [ ] Keep billing in test mode until KYC, webhook replay, and refunds are verified.
- [ ] Re-run `./scripts/verify.ps1` on the deployed SHA.
- [ ] Watch the first ten real jobs before announcing widely.
