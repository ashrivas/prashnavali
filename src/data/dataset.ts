import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Sentiment } from "../types";

export interface Answer {
  answer_id: number;
  chaupai_source_index: number;
  shared_with_answer_id?: number;
  answer_line_devanagari: string;
  answer_line_iast: string;
  full_chaupai_devanagari: string;
  kand: string;
  prasang: string;
  narrative_context_english: string;
  narrative_context_hindi: string;
  meaning_english: string;
  meaning_hindi: string;
  sentiment: Sentiment;
  answer_summary_hindi: string;
  answer_summary_english: string;
}

export interface AiInterpretationGuidance {
  purpose: string;
  principles: string[];
  sentiment_to_tone_mapping: Record<string, string>;
  boundary_conditions: {
    harmful_questions: string;
    medical_emergencies: string;
    mental_health_crisis: string;
  };
}

interface Dataset {
  metadata: Record<string, unknown>;
  structure: {
    grid: { rows: number; cols: number; total_squares: number };
    trace_algorithm: string;
    lane_count: number;
    answer_count: number;
  };
  answers: Answer[];
  ai_interpretation_guidance: AiInterpretationGuidance;
}

const datasetPath = join(__dirname, "..", "..", "data", "prashnavali.json");

export const dataset: Dataset = JSON.parse(readFileSync(datasetPath, "utf-8"));

const answersById = new Map<number, Answer>(
  dataset.answers.map((a) => [a.answer_id, a]),
);

export function getAnswerById(answerId: number): Answer | undefined {
  return answersById.get(answerId);
}

export const aiGuidance = dataset.ai_interpretation_guidance;
export const totalSquares = dataset.structure.grid.total_squares;
