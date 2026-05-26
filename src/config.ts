import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`missing required env var: ${name}`);
  return value;
}

function optional(name: string, fallback: string): string {
  return process.env[name] || fallback;
}

export const config = {
  port: Number(optional("PORT", "8080")),
  whatsapp: {
    verifyToken: optional("WHATSAPP_VERIFY_TOKEN", "dev-verify-token"),
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN ?? "",
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ?? "",
    appSecret: process.env.WHATSAPP_APP_SECRET ?? "",
  },
  gcp: {
    projectId: process.env.GCP_PROJECT_ID ?? "",
    location: optional("GCP_LOCATION", "us-central1"),
    geminiModel: optional("GEMINI_MODEL", "gemini-2.0-flash"),
  },
  assets: {
    welcomeImageUrl: process.env.WELCOME_IMAGE_URL ?? "",
    gridImageUrl: process.env.GRID_IMAGE_URL ?? "",
  },
};

export { required };
