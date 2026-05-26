export interface Button {
  id: string;
  title: string;
}

// Channel-agnostic outgoing intents. Adapters translate these to their wire
// format (WhatsApp Graph API, iOS push, etc.).
export type OutgoingMessage =
  | { kind: "text"; body: string }
  | { kind: "image"; url: string; caption?: string }
  | { kind: "buttons"; body: string; buttons: Button[] };

// Channel-agnostic incoming message, normalised from the adapter payload.
export type IncomingMessage =
  | { kind: "text"; text: string }
  | { kind: "audio"; audioRef: string }
  | { kind: "button"; buttonId: string; title: string };
