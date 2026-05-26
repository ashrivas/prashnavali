import type { Answer } from "../data/dataset";

// Personalised Hindi interpretation tying the user's question to the derived
// chaupai. Milestone 5 replaces this with a Gemini Flash (Vertex AI) call that
// uses the dataset's ai_interpretation_guidance as its system prompt.
export async function generateGuidance(
  answer: Answer,
  _question: string,
): Promise<string> {
  return answer.answer_summary_hindi;
}
