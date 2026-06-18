# Prashnavali Phase 1 Deploy — Session Log

End-to-end walkthrough of taking Prashnavali from "code exists, GCP project
created" to "live WhatsApp bot replying to messages." Captures every blocker
hit and how it was resolved, so the next deploy (production number, second
environment, fresh ICE-cream-truck VM) can skip the dead ends.

## Final state

- Cloud Run service `prashnavali` in `us-central1`, project `prashnavali-498023`.
- Public URL: `https://prashnavali-b55ebku6fa-uc.a.run.app`
- Webhook endpoint: `POST/GET /webhook/whatsapp`
- Backed by Firestore (`(default)` database, `us-central1`).
- Secrets in Secret Manager: `wa-access-token`, `wa-app-secret`, `wa-verify-token`.
- WhatsApp test number `+1 555 659 7906`, Phone Number ID `1075015139031880`,
  WABA ID `1256165989636480`.
- System user authoring tokens: **`prashnavali-bot2`** (first system user
  `prashnavali-bot` was retired after its token was leaked into chat — see
  "Token rotation" below).

## What got written in the repo this session

- `scripts/setup-gcp.sh` — idempotent bootstrap: enables APIs, creates the
  Firestore database, creates the assets bucket, uploads `assets/grid.png`,
  grants `allUsers:objectViewer` on the bucket.
- `scripts/create-secrets.sh` — reads `.env` and pushes WhatsApp credentials
  into Secret Manager. Re-runnable; existing secrets get a new version.
- `.env.example` updated with the GCP project ID baked in.

## Deploy order (the dry version)

1. Have a Meta developer account, app, and WhatsApp Business Account.
2. Have a GCP project (`prashnavali-498023`).
3. On laptop, clone the repo and `cd` into it.
4. `gcloud auth login`, then `PROJECT=prashnavali-498023 ./scripts/setup-gcp.sh`.
5. Generate a permanent WhatsApp access token (see "WhatsApp setup" below).
6. Copy `.env.example` → `.env`, fill in the four `WHATSAPP_*` values.
7. `PROJECT=prashnavali-498023 ./scripts/create-secrets.sh`.
8. Grant runtime IAM (see "IAM grants" below).
9. Deploy with `gcloud builds submit --tag` + `gcloud run deploy --image`
   (do **not** use `gcloud run deploy --source` — it tries buildpacks instead
   of the Dockerfile; see "Build path" below).
10. Configure the Meta webhook to point at the Cloud Run URL.

The rest of this doc is the long version with every dead end annotated.

## WhatsApp / Meta setup

Created via the Meta developer dashboard:

- Business Portfolio at business.facebook.com.
- App at developers.facebook.com (use case: Other → Business).
- Added the WhatsApp product to the app. Free test number was provisioned
  automatically.
- Test recipient: added own phone via *Manage phone number list*.
- System user in Business Settings → Users → System users → **Admin** role.
- Assigned assets: **App** with Full access, **WhatsApp account** with Full
  control. Both are required — assigning only the App leaves the token
  unable to send messages.

### Where the WhatsApp asset assignment lives (UI gotcha)

The "Add Assets" dialog from the System User page only shows *Facebook Pages*
and *Apps* — it does **not** list WhatsApp accounts. To assign a WABA to a
system user, go the other direction:

`business.facebook.com → Settings → Accounts → WhatsApp accounts → click WABA → Users tab → Add people`

and search by the system user's ID. This is the step that bit us — the first
bot (`prashnavali-bot`) was assigned the App but not the WABA, which made
the access token "valid" (`/me` returned the bot's identity) but useless for
sending messages (every send returned `Object with ID '...' does not exist`).

### Token scopes

`whatsapp_business_messaging` + `whatsapp_business_management`, never expires.
Both scopes are required: the messaging one alone leaves you unable to query
phone numbers, which most flows need.

### Token rotation

A token was pasted into chat during the session; treat that as compromised
and revoke it. The current production token belongs to `prashnavali-bot2`.

## GCP setup

`scripts/setup-gcp.sh` does the API enable + DB + bucket dance. Worth
calling out:

- **API enablement is eventually consistent.** First run hit a race where
  `gcloud firestore databases create` returned success but the Firestore
  data API was still propagating — first webhook hits got `SERVICE_DISABLED`
  even though the create call succeeded. Re-running `gcloud services enable`
  and waiting ~30s cleared it.
- **The database has to actually exist.** Same race meant the database
  create silently no-op'd; the running app then hit `NOT_FOUND` (gRPC code 5)
  on every Firestore read. `gcloud firestore databases create --location=us-central1`
  fixed it. Re-running setup-gcp.sh now is safe — it checks before creating.
- **The bucket has to actually exist too.** First run of setup-gcp.sh also
  failed to create the assets bucket for the same reason — re-running it
  later is the fix.

### IAM grants required

These tripped us through three separate deploy attempts. Do them all up front:

```sh
PROJECT=prashnavali-498023
SA=741009679515-compute@developer.gserviceaccount.com  # Compute Engine default SA

# Cloud Build needs these to package and push the source/image
for role in roles/cloudbuild.builds.builder roles/logging.logWriter \
            roles/artifactregistry.writer roles/storage.objectAdmin; do
  gcloud projects add-iam-policy-binding $PROJECT \
    --member="serviceAccount:$SA" --role="$role"
done

# Cloud Run runtime needs these to actually do work
for role in roles/secretmanager.secretAccessor roles/datastore.user \
            roles/aiplatform.user; do
  gcloud projects add-iam-policy-binding $PROJECT \
    --member="serviceAccount:$SA" --role="$role"
done
```

The first batch is *new* — Google stopped auto-granting the Compute Engine
default SA `roles/editor` in 2024. Without these, `gcloud run deploy --source`
fails with `PERMISSION_DENIED: Build failed because the default service
account is missing required IAM permissions`.

## Build path: prefer `builds submit` over `--source`

`gcloud run deploy --source .` is documented to use a Dockerfile if one is
present. In practice it kept falling back to buildpacks during this session
("No buildpack groups passed detection" + the universal builder trying
nodejs/python/ruby/static and failing each) — even after `cd`ing into the
repo root and confirming the Dockerfile was there. The reliable path:

```sh
gcloud builds submit \
  --project=prashnavali-498023 \
  --tag us-central1-docker.pkg.dev/prashnavali-498023/cloud-run-source-deploy/prashnavali:latest \
  .

gcloud run deploy prashnavali \
  --project=prashnavali-498023 \
  --image us-central1-docker.pkg.dev/prashnavali-498023/cloud-run-source-deploy/prashnavali:latest \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "GCP_PROJECT_ID=prashnavali-498023,GCP_LOCATION=us-central1,WHATSAPP_PHONE_NUMBER_ID=1075015139031880" \
  --set-secrets "WHATSAPP_ACCESS_TOKEN=wa-access-token:latest,WHATSAPP_APP_SECRET=wa-app-secret:latest,WHATSAPP_VERIFY_TOKEN=wa-verify-token:latest"
```

`builds submit --tag` unambiguously uses the Dockerfile.

## `--set-secrets` takes secret names, not values

Tripped over this once during the session: `--set-secrets "FOO=secret-string"`
treats `secret-string` as a *Secret Manager secret name*, not the literal value.
The flag form is `ENV_VAR=secret-name:version`. Push values into Secret
Manager first (via `scripts/create-secrets.sh`), then reference by name.

For passing plain values, use `--set-env-vars` instead.

## Webhook URL routing — two service URLs

`gcloud run services list` shows the newer project-number-format URL
(`https://prashnavali-741009679515.us-central1.run.app`). That URL is listed
on the service but isn't actually serving traffic — Google's frontend returns
its generic "robot" 404 page. Use the `status.url` value instead, which is
the legacy hash form:

```
https://prashnavali-b55ebku6fa-uc.a.run.app
```

Both URLs are listed in `metadata.annotations.run.googleapis.com/urls`; only
the second one is honored by the load balancer. Pulling `status.url` is the
reliable way to get it.

## Public access vs the 404 trap

If `--allow-unauthenticated` was silently dropped by org policy, Cloud Run
returns **404 from the Google frontend** to unauthenticated callers (it used
to be 403; the change was made to avoid leaking service existence). The
service still exists and runs — you just can't reach it. Fix:

```sh
gcloud run services add-iam-policy-binding prashnavali \
  --project=prashnavali-498023 --region=us-central1 \
  --member=allUsers --role=roles/run.invoker
```

In this deploy the binding was already in place (org didn't block public
services), so the 404 we saw early on was actually caused by an unset `$URL`
shell variable — `curl` was hitting `google.com/healthz`. Distinguishable
because requests that actually reach Cloud Run carry `server: Google Frontend`
and `x-cloud-trace-context` headers; requests that don't get a different
404 page entirely. Reading curl headers carefully saves time here.

## The `/healthz` mystery (unsolved, not blocking)

After everything else worked, `/healthz` *specifically* returns the GFE 404
page (no `x-powered-by: Express` header), while every other path — `/`,
`/health`, `/foo` — returns Express's 404. Other paths confirm the
container is reachable. The `/healthz` route is registered in `src/server.ts`
and the build is current. Best guess: edge cache or some path-level filter
upstream of the container. Not pursued because the WhatsApp flow is the
real test and `/webhook/whatsapp?hub.mode=…` returns 200 with the challenge
echoed.

## Testing

Once deployed:

```sh
URL=https://prashnavali-b55ebku6fa-uc.a.run.app

# Webhook verify handshake (what Meta will send)
VERIFY_TOKEN=<value from .env>
curl -s "$URL/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=$VERIFY_TOKEN&hub.challenge=test123"
# expect: test123

# Token sanity (catches bad system-user assignments)
WHATSAPP_ACCESS_TOKEN=<value from .env>
curl -s "https://graph.facebook.com/v22.0/1075015139031880?fields=display_phone_number,verified_name" \
  -H "Authorization: Bearer $WHATSAPP_ACCESS_TOKEN"
# expect: {"display_phone_number":"+1 555-659-7906","verified_name":"Test Number","id":"1075015139031880"}
```

Configure the Meta webhook (Callback URL + Verify token), subscribe to the
`messages` field, then send a real WhatsApp message from the registered
test recipient. Logs:

```sh
gcloud run services logs read prashnavali \
  --project=prashnavali-498023 --region=us-central1 --limit=50
```

Healthy flow shows `POST 200 .../webhook/whatsapp` with no `[whatsapp] send failed`
trailing it.

## Rotating a secret after deploy

```sh
# 1. Update .env locally
# 2. Push new version
PROJECT=prashnavali-498023 ./scripts/create-secrets.sh
# 3. Force Cloud Run to pick up :latest (just re-resolves; no rebuild)
gcloud run services update prashnavali \
  --project=prashnavali-498023 --region=us-central1 \
  --update-secrets="WHATSAPP_ACCESS_TOKEN=wa-access-token:latest"
```

To verify the running container sees what you expect:

```sh
# Compare the secret currently stored to what's in .env
gcloud secrets versions access latest --secret=wa-access-token \
  --project=prashnavali-498023 | head -c 30 ; echo
grep '^WHATSAPP_ACCESS_TOKEN' .env | cut -c1-50
```

When these disagree, the script ran against a stale `.env` (common: editing
the file in the wrong directory or forgetting to save).

## Static assets

The grid image lives at:
```
https://storage.googleapis.com/prashnavali-498023-assets/grid.png
```

Set `GRID_IMAGE_URL` on the service:
```sh
gcloud run services update prashnavali \
  --project=prashnavali-498023 --region=us-central1 \
  --update-env-vars="GRID_IMAGE_URL=https://storage.googleapis.com/prashnavali-498023-assets/grid.png"
```

Replacing the image (after editing `assets/grid.png` locally):
```sh
gcloud storage cp assets/grid.png gs://prashnavali-498023-assets/grid.png \
  --project=prashnavali-498023
```

No redeploy needed. WhatsApp may cache the previous image briefly — bump
`?v=N` on the URL to force a re-fetch if it matters.

`WELCOME_IMAGE_URL` is supported by the code but no welcome image exists in
the repo yet — leaving it unset just suppresses the welcome image step,
which is fine.

## Open items

- Add a welcome image asset and set `WELCOME_IMAGE_URL`.
- The `/healthz` GFE 404 — diagnose at some point, but not blocking.
- Decide on production phone number (real WhatsApp Business number vs.
  staying on the test number which is capped at 5 recipients).
- Optional: set up GitHub Actions + Workload Identity Federation so changes
  pushed from automation can deploy without a laptop in the loop.
