import { config } from "../../config";
import type { OutgoingMessage } from "../../core/messages";

const GRAPH_VERSION = "v21.0";

function toPayload(to: string, msg: OutgoingMessage): Record<string, unknown> {
  const base = { messaging_product: "whatsapp", to };
  switch (msg.kind) {
    case "text":
      return { ...base, type: "text", text: { body: msg.body } };
    case "image":
      return {
        ...base,
        type: "image",
        image: { link: msg.url, ...(msg.caption ? { caption: msg.caption } : {}) },
      };
    case "buttons":
      return {
        ...base,
        type: "interactive",
        interactive: {
          type: "button",
          body: { text: msg.body },
          action: {
            buttons: msg.buttons.map((b) => ({
              type: "reply",
              reply: { id: b.id, title: b.title },
            })),
          },
        },
      };
  }
}

export async function sendMessages(
  to: string,
  messages: OutgoingMessage[],
): Promise<void> {
  const { accessToken, phoneNumberId } = config.whatsapp;

  // Dev mode: no credentials yet — log instead of hitting the Graph API so the
  // full flow is testable locally.
  if (!accessToken || !phoneNumberId) {
    for (const msg of messages) {
      console.log("[whatsapp:dev] →", to, JSON.stringify(msg));
    }
    return;
  }

  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`;
  for (const msg of messages) {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(toPayload(to, msg)),
    });
    if (!res.ok) {
      console.error("[whatsapp] send failed", res.status, await res.text());
    }
  }
}
