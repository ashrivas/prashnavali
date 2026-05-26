import type { ExperienceId } from "../types";
import type { Answer } from "../data/dataset";

export interface ExperienceCopy {
  greeting: string;
  askPrompt: string;
  whatIsThis: string;
  gridImageUrl: string;
  sankalpPrompt: string;
  invalidNumber: string;
  generating: string;
  askInText: string;
}

// Common interface every experience implements. The dispatcher calls this and
// never knows the internals (Ram Prashnavali, Gita Oracle, ...).
export interface Experience {
  id: ExperienceId;
  copy: ExperienceCopy;
  derive(square: number): Answer;
  guide(answer: Answer, question: string): Promise<string>;
  formatAnswerCard(answer: Answer): string;
}
