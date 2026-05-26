import { config } from "../config";
import { aiGuidance, type Answer } from "../data/dataset";
import { getGeminiClient } from "./gemini";

// System prompt assembled from the dataset's interpretation guidance so the
// behaviour stays data-driven: editing prashnavali.json changes the AI's tone
// and safety rules without touching code.
export function buildSystemPrompt(): string {
  const g = aiGuidance;
  return [
    g.purpose,
    "",
    "Principles:",
    ...g.principles.map((p) => `- ${p}`),
    "",
    "Sentiment-to-tone mapping:",
    ...Object.entries(g.sentiment_to_tone_mapping).map(
      ([sentiment, tone]) => `- ${sentiment}: ${tone}`,
    ),
    "",
    "Boundary conditions (these override everything else):",
    `- Harmful questions: ${g.boundary_conditions.harmful_questions}`,
    `- Medical emergencies: ${g.boundary_conditions.medical_emergencies}`,
    `- Mental health crisis: ${g.boundary_conditions.mental_health_crisis}`,
    "",
    "Always respond in warm, respectful Hindi (Devanagari), 3-5 sentences.",
    "Speak to the seeker directly. Do not invent verses, translations, or facts beyond what is provided. Do not predict specific future events; offer guidance and reflection.",
  ].join("\n");
}

function buildUserPrompt(answer: Answer, question: string): string {
  return [
    `Seeker's question: ${question}`,
    "",
    "Derived chaupai (treat as fixed truth, do not alter):",
    `- Verse: ${answer.full_chaupai_devanagari}`,
    `- Relevant line: ${answer.answer_line_devanagari}`,
    `- Meaning: ${answer.meaning_english}`,
    `- Kand: ${answer.kand}`,
    `- Prasang: ${answer.prasang}`,
    `- Narrative context: ${answer.narrative_context_english}`,
    `- Sentiment: ${answer.sentiment}`,
    `- Canonical Hindi summary: ${answer.answer_summary_hindi}`,
    "",
    "Write a personalised interpretation that connects this chaupai to the seeker's question, in the tone indicated by the sentiment.",
  ].join("\n");
}

// Personalised Hindi interpretation tying the seeker's question to the derived
// chaupai. Falls back to the dataset's canonical summary when GCP is
// unconfigured, the question is empty, or the model call fails.
export async function generateGuidance(
  answer: Answer,
  question: string,
): Promise<string> {
  const client = getGeminiClient();
  const trimmed = question.trim();
  if (!client || !trimmed) {
    return answer.answer_summary_hindi;
  }

  try {
    const res = await client.models.generateContent({
      model: config.gcp.geminiModel,
      contents: buildUserPrompt(answer, trimmed),
      config: {
        systemInstruction: buildSystemPrompt(),
        temperature: 0.7,
        maxOutputTokens: 500,
      },
    });
    return (res.text ?? "").trim() || answer.answer_summary_hindi;
  } catch (err) {
    console.error("[guidance] gemini error", err);
    return answer.answer_summary_hindi;
  }
}
