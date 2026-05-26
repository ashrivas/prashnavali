import { config } from "../config";
import { getGeminiClient } from "./gemini";

const PROMPT =
  "Transcribe this audio verbatim. The speaker is asking a personal, often spiritual question, usually in Hindi (Devanagari) or English. Return only the transcription with no commentary, labels, or quotation marks.";

// Transcribes a voice note using Gemini's native audio understanding. When GCP
// is not configured (local dev), returns a canned transcript so the voice flow
// stays exercisable end to end.
export async function transcribeAudio(
  bytes: Buffer,
  mimeType: string,
): Promise<string> {
  const client = getGeminiClient();
  if (!client || bytes.length === 0) {
    console.log("[transcription:dev] returning canned transcript");
    return "क्या मुझे यह निर्णय लेना चाहिए?";
  }

  const res = await client.models.generateContent({
    model: config.gcp.geminiModel,
    contents: [
      {
        role: "user",
        parts: [
          { text: PROMPT },
          { inlineData: { mimeType, data: bytes.toString("base64") } },
        ],
      },
    ],
  });

  return (res.text ?? "").trim();
}
