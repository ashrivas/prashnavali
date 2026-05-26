import type { Request, Response } from "express";
import { config } from "../../config";
import { SessionManager } from "../../core/sessionManager";
import { createSessionStore } from "../../core/sessionStoreFactory";
import { routeToExperience } from "../../core/experienceRouter";
import { dispatch } from "../../core/dispatcher";
import { parseInbound } from "./parse";
import { sendMessages } from "./sender";
import { transcribeWhatsAppAudio } from "./voice";
import { verifySignature } from "./signature";

const sessions = new SessionManager(createSessionStore());

// Lightweight in-memory dedup so Meta webhook retries are not processed twice.
const seenMessageIds = new Set<string>();
function alreadyHandled(id: string): boolean {
  if (seenMessageIds.has(id)) return true;
  seenMessageIds.add(id);
  if (seenMessageIds.size > 5000) {
    seenMessageIds.delete(seenMessageIds.values().next().value as string);
  }
  return false;
}

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
// Meta does not retry.
export function receiveWebhook(req: Request, res: Response): void {
  const rawBody = (req as { rawBody?: Buffer }).rawBody ?? Buffer.alloc(0);
  if (!verifySignature(rawBody, req.header("x-hub-signature-256"))) {
    res.sendStatus(401);
    return;
  }
  res.sendStatus(200);
  void handle(req.body);
}

async function handle(body: unknown): Promise<void> {
  const parsed = parseInbound(body);
  if (!parsed) return;
  if (alreadyHandled(parsed.messageId)) return;

  try {
    const session = await sessions.loadOrCreate("whatsapp", parsed.userId);
    const experience = routeToExperience();
    const outgoing = await dispatch(session, parsed.message, experience, {
      transcribe: transcribeWhatsAppAudio,
    });
    await sessions.save(session);
    await sendMessages(parsed.userId, outgoing);
  } catch (err) {
    console.error("[whatsapp] handler error", err);
  }
}
