#!/usr/bin/env bash
set -euo pipefail

# Push WhatsApp credentials into Secret Manager.
# Reads from your local .env (must have the WHATSAPP_* vars filled in).
#
# Usage:
#   PROJECT=prashnavali-498023 ./scripts/create-secrets.sh

PROJECT="${PROJECT:?set PROJECT=your-gcp-project-id}"
gcloud config set project "$PROJECT" >/dev/null

if [[ ! -f .env ]]; then
  echo ".env not found — copy .env.example and fill in WhatsApp values first" >&2
  exit 1
fi
# shellcheck disable=SC1091
set -a; source .env; set +a

put_secret() {
  local name="$1" value="$2"
  if [[ -z "$value" ]]; then
    echo "    $name is empty in .env, skipping"
    return
  fi
  if gcloud secrets describe "$name" >/dev/null 2>&1; then
    printf '%s' "$value" | gcloud secrets versions add "$name" --data-file=-
  else
    printf '%s' "$value" | gcloud secrets create "$name" --data-file=-
  fi
  echo "    $name written"
}

echo "==> Writing secrets"
put_secret wa-access-token "${WHATSAPP_ACCESS_TOKEN:-}"
put_secret wa-app-secret   "${WHATSAPP_APP_SECRET:-}"
put_secret wa-verify-token "${WHATSAPP_VERIFY_TOKEN:-}"
