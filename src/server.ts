import express from "express";
import { verifyWebhook, receiveWebhook } from "./channels/whatsapp/webhook";

export function createApp() {
  const app = express();
  // Capture the raw body so the WhatsApp webhook can verify Meta's signature.
  app.use(
    express.json({
      verify: (req, _res, buf) => {
        (req as { rawBody?: Buffer }).rawBody = buf;
      },
    }),
  );

  app.get("/healthz", (_req, res) => res.json({ status: "ok" }));

  app.get("/webhook/whatsapp", verifyWebhook);
  app.post("/webhook/whatsapp", receiveWebhook);

  return app;
}
