#!/usr/bin/env bash
set -euo pipefail

# One-shot GCP bootstrap for Prashnavali.
# Run locally with gcloud already authenticated (`gcloud auth login`).
#
# Usage:
#   PROJECT=prashnavali-498023 ./scripts/setup-gcp.sh
#
# Idempotent: re-running skips work that's already done.

PROJECT="${PROJECT:?set PROJECT=your-gcp-project-id}"
REGION="${REGION:-us-central1}"
BUCKET="${BUCKET:-${PROJECT}-assets}"

echo "==> Project: $PROJECT   Region: $REGION   Bucket: gs://$BUCKET"
gcloud config set project "$PROJECT" >/dev/null

echo "==> Enabling APIs"
gcloud services enable \
  run.googleapis.com \
  aiplatform.googleapis.com \
  firestore.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  storage.googleapis.com

echo "==> Firestore (native mode)"
if ! gcloud firestore databases describe --database='(default)' >/dev/null 2>&1; then
  gcloud firestore databases create --location="$REGION"
else
  echo "    already exists, skipping"
fi

echo "==> Assets bucket"
if ! gcloud storage buckets describe "gs://$BUCKET" >/dev/null 2>&1; then
  gcloud storage buckets create "gs://$BUCKET" --location="$REGION"
else
  echo "    already exists, skipping"
fi

if [[ -f assets/grid.png ]]; then
  echo "==> Uploading assets/grid.png"
  gcloud storage cp assets/grid.png "gs://$BUCKET/grid.png"
  gcloud storage buckets add-iam-policy-binding "gs://$BUCKET" \
    --member=allUsers --role=roles/storage.objectViewer >/dev/null
  echo "    public URL: https://storage.googleapis.com/$BUCKET/grid.png"
else
  echo "    assets/grid.png missing, skipping upload"
fi

echo
echo "GCP base setup complete."
echo "Next: get WhatsApp credentials from Meta, then run scripts/create-secrets.sh"
