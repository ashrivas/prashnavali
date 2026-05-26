import crypto from "node:crypto";
import { config } from "../../config";

// Verifies Meta's X-Hub-Signature-256 header (HMAC-SHA256 of the raw body using
// the app secret). When no app secret is configured (local dev), verification
// is skipped so the webhook stays testable.
export function verifySignature(
  rawBody: Buffer,
  signatureHeader: string | undefined,
): boolean {
  const secret = config.whatsapp.appSecret;
  if (!secret) return true;
  if (!signatureHeader) return false;

  const expected =
    "sha256=" +
    crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

  const received = Buffer.from(signatureHeader);
  const computed = Buffer.from(expected);
  if (received.length !== computed.length) return false;
  return crypto.timingSafeEqual(received, computed);
}
