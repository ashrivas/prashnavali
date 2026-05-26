import { test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { verifySignature } from "./signature";
import { config } from "../../config";

function sign(secret: string, body: Buffer): string {
  return "sha256=" + crypto.createHmac("sha256", secret).update(body).digest("hex");
}

test("accepts everything when no app secret is configured (dev)", () => {
  config.whatsapp.appSecret = "";
  assert.equal(verifySignature(Buffer.from("{}"), undefined), true);
});

test("accepts a correct signature and rejects a tampered one", () => {
  const secret = "test-secret";
  config.whatsapp.appSecret = secret;
  const body = Buffer.from(JSON.stringify({ hello: "world" }));

  assert.equal(verifySignature(body, sign(secret, body)), true);
  assert.equal(verifySignature(body, sign("wrong-secret", body)), false);
  assert.equal(verifySignature(body, undefined), false);

  config.whatsapp.appSecret = "";
});
