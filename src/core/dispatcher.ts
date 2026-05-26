import type { Session } from "../types";
import type { Experience } from "../experiences/types";
import type { IncomingMessage, OutgoingMessage } from "./messages";
import { config } from "../config";
import { isValidSquare } from "./chaupaiDerivation";

export const BTN = {
  ASK: "ask",
  WHAT: "what",
  AGAIN: "again",
  SHARE: "share",
  SAVE: "save",
} as const;

const DEVANAGARI_DIGITS = "०१२३४५६७८९";

function parseSquare(text: string): number | null {
  const normalised = text
    .trim()
    .replace(/[०-९]/g, (d) => String(DEVANAGARI_DIGITS.indexOf(d)));
  const match = normalised.match(/\d+/);
  if (!match) return null;
  const n = Number(match[0]);
  return isValidSquare(n) ? n : null;
}

function welcomeMessages(exp: Experience): OutgoingMessage[] {
  const messages: OutgoingMessage[] = [];
  if (config.assets.welcomeImageUrl) {
    messages.push({ kind: "image", url: config.assets.welcomeImageUrl });
  }
  messages.push({
    kind: "buttons",
    body: exp.copy.greeting,
    buttons: [
      { id: BTN.ASK, title: "पूछना है" },
      { id: BTN.WHAT, title: "यह क्या है?" },
    ],
  });
  return messages;
}

function gridMessages(exp: Experience): OutgoingMessage[] {
  const messages: OutgoingMessage[] = [];
  if (exp.copy.gridImageUrl) {
    messages.push({ kind: "image", url: exp.copy.gridImageUrl });
  }
  messages.push({ kind: "text", body: exp.copy.sankalpPrompt });
  return messages;
}

async function answerMessages(
  exp: Experience,
  session: Session,
): Promise<OutgoingMessage[]> {
  const answer = exp.derive(session.square!);
  session.last_answer_id = answer.answer_id;
  const guidance = await exp.guide(answer, session.question ?? "");
  return [
    { kind: "text", body: guidance },
    { kind: "text", body: exp.formatAnswerCard(answer) },
    {
      kind: "buttons",
      body: "🙏 आगे?",
      buttons: [
        { id: BTN.AGAIN, title: "एक और प्रश्न" },
        { id: BTN.SHARE, title: "मित्र को भेजें" },
        { id: BTN.SAVE, title: "सहेजें" },
      ],
    },
  ];
}

function askPrompt(exp: Experience): OutgoingMessage {
  return { kind: "text", body: exp.copy.askPrompt };
}

// Drives one inbound message through the session state machine. Mutates the
// session in place and returns the channel-agnostic outgoing messages.
export async function dispatch(
  session: Session,
  msg: IncomingMessage,
  exp: Experience,
): Promise<OutgoingMessage[]> {
  const buttonId = msg.kind === "button" ? msg.buttonId : null;

  switch (session.state) {
    case "IDLE": {
      session.experience = exp.id;
      session.state = "WELCOMED";
      return welcomeMessages(exp);
    }

    case "WELCOMED": {
      if (buttonId === BTN.WHAT) {
        return [
          { kind: "text", body: exp.copy.whatIsThis },
          ...welcomeMessages(exp),
        ];
      }
      if (buttonId === BTN.ASK) {
        session.state = "QUESTION_PENDING";
        return [askPrompt(exp)];
      }
      return welcomeMessages(exp);
    }

    case "QUESTION_PENDING": {
      if (msg.kind === "audio") {
        // Voice transcription is wired up in milestone 4.
        return [{ kind: "text", body: exp.copy.askInText }];
      }
      if (msg.kind === "text") {
        session.question = msg.text.trim();
        session.state = "NUMBER_PENDING";
        return gridMessages(exp);
      }
      return [askPrompt(exp)];
    }

    case "NUMBER_PENDING": {
      const square = msg.kind === "text" ? parseSquare(msg.text) : null;
      if (square === null) {
        return [{ kind: "text", body: exp.copy.invalidNumber }];
      }
      session.square = square;
      session.state = "GENERATING";
      const generating: OutgoingMessage = {
        kind: "text",
        body: exp.copy.generating,
      };
      const answer = await answerMessages(exp, session);
      session.state = "ANSWERED";
      return [generating, ...answer];
    }

    case "GENERATING": {
      // Generation is synchronous in Phase 1; this state is transient. A
      // message arriving here means the user is impatient — reassure them.
      return [{ kind: "text", body: exp.copy.generating }];
    }

    case "ANSWERED": {
      if (buttonId === BTN.AGAIN) {
        session.question = null;
        session.square = null;
        session.state = "QUESTION_PENDING";
        return [askPrompt(exp)];
      }
      if (buttonId === BTN.SHARE) {
        return [
          {
            kind: "text",
            body: "इस पवित्र अनुभव को अपने मित्रों के साथ साझा करें। 🙏",
          },
        ];
      }
      if (buttonId === BTN.SAVE) {
        const answer = exp.derive(session.square!);
        return [{ kind: "text", body: exp.formatAnswerCard(answer) }];
      }
      // Free text after an answer is treated as a fresh question.
      if (msg.kind === "text") {
        session.question = msg.text.trim();
        session.square = null;
        session.state = "NUMBER_PENDING";
        return gridMessages(exp);
      }
      return [askPrompt(exp)];
    }

    default:
      return welcomeMessages(exp);
  }
}
