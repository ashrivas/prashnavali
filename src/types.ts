export type Channel = "whatsapp" | "ios";

export type ExperienceId = "ram_prashnavali" | "gita_oracle";

export type SessionState =
  | "IDLE"
  | "WELCOMED"
  | "QUESTION_PENDING"
  | "NUMBER_PENDING"
  | "GENERATING"
  | "ANSWERED";

export type Sentiment =
  | "very_favorable"
  | "favorable"
  | "favorable_with_strategy"
  | "surrender"
  | "cautious"
  | "warning"
  | "unfavorable";

export interface Session {
  user_id: string;
  channel: Channel;
  experience: ExperienceId | null;
  state: SessionState;
  question: string | null;
  square: number | null;
  last_answer_id: number | null;
  created_at: number;
  updated_at: number;
}
