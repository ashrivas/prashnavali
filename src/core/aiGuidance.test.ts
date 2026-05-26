import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSystemPrompt, generateGuidance } from "./aiGuidance";
import { getAnswerById } from "../data/dataset";

test("system prompt embeds principles, tone mapping, and safety boundaries", () => {
  const prompt = buildSystemPrompt();
  assert.match(prompt, /Principles:/);
  assert.match(prompt, /Sentiment-to-tone mapping:/);
  assert.match(prompt, /Boundary conditions/);
  assert.match(prompt, /Harmful questions:/);
  assert.match(prompt, /Mental health crisis:/);
});

test("falls back to canonical summary when GCP is unconfigured", async () => {
  const answer = getAnswerById(1)!;
  const out = await generateGuidance(answer, "क्या मुझे आगे बढ़ना चाहिए?");
  assert.equal(out, answer.answer_summary_hindi);
});

test("falls back on an empty question without calling the model", async () => {
  const answer = getAnswerById(3)!;
  const out = await generateGuidance(answer, "   ");
  assert.equal(out, answer.answer_summary_hindi);
});
