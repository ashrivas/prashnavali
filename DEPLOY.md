# Deploying Prashnavali (Phase 1)

The app is a single stateless container (Express) that talks to WhatsApp,
Firestore (sessions), and Vertex AI / Gemini (transcription + guidance). It is
designed to run on Cloud Run.

## Environment variables

| Variable | Required | Notes |
| --- | --- | --- |
| `PORT` | no | Defaults to `8080` (Cloud Run sets this). |
| `WHATSAPP_VERIFY_TOKEN` | yes | Arbitrary string; must match the value entered in the Meta webhook config. |
| `WHATSAPP_ACCESS_TOKEN` | yes | Permanent token for the WhatsApp Business phone number. Store as a secret. |
| `WHATSAPP_PHONE_NUMBER_ID` | yes | The phone number ID from the Meta dashboard. |
| `WHATSAPP_APP_SECRET` | yes | App secret used to verify `X-Hub-Signature-256`. Store as a secret. |
| `GCP_PROJECT_ID` | yes | Enables Firestore + Vertex AI. When unset the app runs fully in dev mode. |
| `GCP_LOCATION` | no | Vertex region, default `us-central1`. |
| `GEMINI_MODEL` | no | Default `gemini-2.0-flash`. |
| `WELCOME_IMAGE_URL` | no | Public GCS URL for the welcome image. Skipped if unset. |
| `GRID_IMAGE_URL` | no | Public GCS URL for the 225-square grid. Skipped if unset. |

> Without `GCP_PROJECT_ID` the app uses an in-memory session store and canned
> transcription/guidance — useful for local testing, not for production.

## One-time GCP setup

```sh
PROJECT=your-project-id
REGION=us-central1
gcloud config set project "$PROJECT"

# APIs
gcloud services enable run.googleapis.com aiplatform.googleapis.com \
  firestore.googleapis.com artifactregistry.googleapis.com \
  secretmanager.googleapis.com

# Firestore (native mode) for sessions
gcloud firestore databases create --location="$REGION"

# Secrets
printf '%s' "$WHATSAPP_ACCESS_TOKEN" | gcloud secrets create wa-access-token --data-file=-
printf '%s' "$WHATSAPP_APP_SECRET"   | gcloud secrets create wa-app-secret   --data-file=-
printf '%s' "$WHATSAPP_VERIFY_TOKEN" | gcloud secrets create wa-verify-token --data-file=-
```

## Static assets (optional but recommended)

```sh
gsutil mb -l "$REGION" "gs://$PROJECT-assets"
gsutil cp welcome.png grid.png "gs://$PROJECT-assets/"
gsutil iam ch allUsers:objectViewer "gs://$PROJECT-assets"
# Then set WELCOME_IMAGE_URL / GRID_IMAGE_URL to the public https URLs.
```

## Deploy to Cloud Run

`gcloud run deploy` builds the `Dockerfile` automatically:

```sh
gcloud run deploy prashnavali \
  --source . \
  --region "$REGION" \
  --allow-unauthenticated \
  --set-env-vars "GCP_PROJECT_ID=$PROJECT,GCP_LOCATION=$REGION,WHATSAPP_PHONE_NUMBER_ID=$WHATSAPP_PHONE_NUMBER_ID" \
  --set-secrets "WHATSAPP_ACCESS_TOKEN=wa-access-token:latest,WHATSAPP_APP_SECRET=wa-app-secret:latest,WHATSAPP_VERIFY_TOKEN=wa-verify-token:latest"
```

Grant the Cloud Run runtime service account access to Vertex AI and Firestore:

```sh
SA=$(gcloud run services describe prashnavali --region "$REGION" \
  --format='value(spec.template.spec.serviceAccountName)')
gcloud projects add-iam-policy-binding "$PROJECT" \
  --member="serviceAccount:$SA" --role=roles/aiplatform.user
gcloud projects add-iam-policy-binding "$PROJECT" \
  --member="serviceAccount:$SA" --role=roles/datastore.user
```

## Configure the Meta webhook

1. In the Meta App dashboard → WhatsApp → Configuration, set the callback URL to
   `https://<cloud-run-url>/webhook/whatsapp`.
2. Enter the same string you used for `WHATSAPP_VERIFY_TOKEN`.
3. Subscribe to the **messages** field.

Meta sends a `GET` verification request (handled by the app), then delivers
inbound messages as signed `POST` requests.

## Local development

```sh
cp .env.example .env   # fill in what you have; blanks fall back to dev mode
npm install
npm run dev            # tsx watch, listens on :8080
npm test               # unit + flow tests
```
