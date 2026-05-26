import type { IncomingMessage } from "../../core/messages";

export interface ParsedInbound {
  userId: string;
  messageId: string;
  message: IncomingMessage;
}

// Pulls the first user message out of a WhatsApp webhook payload and normalises
// it to a channel-agnostic IncomingMessage. Returns null for status callbacks
// and unsupported message types.
export function parseInbound(body: unknown): ParsedInbound | null {
  const value = (body as any)?.entry?.[0]?.changes?.[0]?.value;
  const raw = value?.messages?.[0];
  if (!raw) return null;

  const userId: string = raw.from;
  const messageId: string = raw.id;

  switch (raw.type) {
    case "text":
      return {
        userId,
        messageId,
        message: { kind: "text", text: raw.text?.body ?? "" },
      };
    case "audio":
      return {
        userId,
        messageId,
        message: { kind: "audio", audioRef: raw.audio?.id ?? "" },
      };
    case "interactive": {
      const reply = raw.interactive?.button_reply ?? raw.interactive?.list_reply;
      if (!reply) return null;
      return {
        userId,
        messageId,
        message: { kind: "button", buttonId: reply.id, title: reply.title },
      };
    }
    default:
      return null;
  }
}
