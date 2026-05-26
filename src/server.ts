import express from "express";
import { verifyWebhook, receiveWebhook } from "./channels/whatsapp/webhook";

export function createApp() {
  const app = express();
  app.use(express.json());

  app.get("/healthz", (_req, res) => res.json({ status: "ok" }));

  app.get("/webhook/whatsapp", verifyWebhook);
  app.post("/webhook/whatsapp", receiveWebhook);

  return app;
}
