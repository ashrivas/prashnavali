import { test } from "node:test";
import assert from "node:assert/strict";
import { dispatch, BTN } from "./dispatcher";
import { SessionManager } from "./sessionManager";
import { InMemorySessionStore } from "./sessionStore";
import { ramPrashnavali } from "../experiences/ramPrashnavali";
import type { IncomingMessage } from "./messages";

async function run() {
  const sessions = new SessionManager(new InMemorySessionStore());
  const exp = ramPrashnavali;

  async function step(msg: IncomingMessage) {
    const s = await sessions.loadOrCreate("whatsapp", "u1");
    const out = await dispatch(s, msg, exp);
    await sessions.save(s);
    return { state: s.state, out, session: s };
  }

  return { sessions, step };
}

test("happy path: entry → ask → question → number → answer", async () => {
  const { step } = await run();

  let r = await step({ kind: "text", text: "hi" });
  assert.equal(r.state, "WELCOMED");
  assert.ok(r.out.some((m) => m.kind === "buttons"));

  r = await step({ kind: "button", buttonId: BTN.ASK, title: "पूछना है" });
  assert.equal(r.state, "QUESTION_PENDING");

  r = await step({ kind: "text", text: "क्या मुझे यह कार्य करना चाहिए?" });
  assert.equal(r.state, "NUMBER_PENDING");

  r = await step({ kind: "text", text: "108" });
  assert.equal(r.state, "ANSWERED");
  assert.equal(r.session.square, 108);
  assert.equal(r.session.last_answer_id, 9);
  // generating + guidance + card + buttons
  assert.equal(r.out.length, 4);
  assert.equal(r.out.at(-1)?.kind, "buttons");
});

test("invalid number re-prompts and stays in NUMBER_PENDING", async () => {
  const { step } = await run();
  await step({ kind: "text", text: "hi" });
  await step({ kind: "button", buttonId: BTN.ASK, title: "पूछना है" });
  await step({ kind: "text", text: "मेरा प्रश्न" });

  let r = await step({ kind: "text", text: "999" });
  assert.equal(r.state, "NUMBER_PENDING");

  r = await step({ kind: "text", text: "१०" }); // devanagari 10
  assert.equal(r.state, "ANSWERED");
  assert.equal(r.session.square, 10);
});

test("voice note transcribes into the question and advances to NUMBER_PENDING", async () => {
  const sessions = new SessionManager(new InMemorySessionStore());
  const exp = ramPrashnavali;
  const deps = { transcribe: async () => "क्या यह यात्रा शुभ है?" };

  async function step(msg: IncomingMessage) {
    const s = await sessions.loadOrCreate("whatsapp", "v1");
    const out = await dispatch(s, msg, exp, deps);
    await sessions.save(s);
    return { state: s.state, out, session: s };
  }

  await step({ kind: "text", text: "hi" });
  await step({ kind: "button", buttonId: BTN.ASK, title: "पूछना है" });

  const r = await step({ kind: "audio", audioRef: "media-123" });
  assert.equal(r.state, "NUMBER_PENDING");
  assert.equal(r.session.question, "क्या यह यात्रा शुभ है?");
  assert.ok(r.out[0].kind === "text" && r.out[0].body.includes("यात्रा"));
});

test("audio without a transcriber falls back to the type-please prompt", async () => {
  const sessions = new SessionManager(new InMemorySessionStore());
  const exp = ramPrashnavali;

  async function step(msg: IncomingMessage) {
    const s = await sessions.loadOrCreate("whatsapp", "v2");
    const out = await dispatch(s, msg, exp); // no deps
    await sessions.save(s);
    return { state: s.state, out };
  }

  await step({ kind: "text", text: "hi" });
  await step({ kind: "button", buttonId: BTN.ASK, title: "पूछना है" });
  const r = await step({ kind: "audio", audioRef: "media-x" });
  assert.equal(r.state, "QUESTION_PENDING");
  assert.equal(r.out[0].kind, "text");
});

test("'ek aur prashna' resets to QUESTION_PENDING", async () => {
  const { step } = await run();
  await step({ kind: "text", text: "hi" });
  await step({ kind: "button", buttonId: BTN.ASK, title: "पूछना है" });
  await step({ kind: "text", text: "प्रश्न" });
  await step({ kind: "text", text: "5" });

  const r = await step({ kind: "button", buttonId: BTN.AGAIN, title: "एक और प्रश्न" });
  assert.equal(r.state, "QUESTION_PENDING");
  assert.equal(r.session.question, null);
});
