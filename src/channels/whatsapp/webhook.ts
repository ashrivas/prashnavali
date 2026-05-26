import type { Request, Response } from "express";
import { config } from "../../config";

// Meta verification handshake (GET). Echoes the challenge if the token matches.
export function verifyWebhook(req: Request, res: Response): void {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === config.whatsapp.verifyToken) {
    res.status(200).send(challenge);
    return;
  }
  res.sendStatus(403);
}

// Incoming messages (POST). Ack 200 immediately, then process out of band so
// Meta does not retry. Processing is wired up in a later milestone.
export function receiveWebhook(req: Request, res: Response): void {
  res.sendStatus(200);

  const entry = req.body?.entry?.[0]?.changes?.[0]?.value;
  const message = entry?.messages?.[0];
  if (!message) return; // status callbacks etc.

  // TODO(milestone 3): dispatch to session manager + state machine.
  console.log("[whatsapp] incoming", {
    from: message.from,
    type: message.type,
    id: message.id,
  });
}
