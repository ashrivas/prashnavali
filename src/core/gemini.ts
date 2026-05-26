import { GoogleGenAI } from "@google/genai";
import { config } from "../config";

let client: GoogleGenAI | null = null;

// Shared Vertex AI client. Returns null when no GCP project is configured so
// callers can fall back to dev behaviour without crashing.
export function getGeminiClient(): GoogleGenAI | null {
  if (!config.gcp.projectId) return null;
  if (!client) {
    client = new GoogleGenAI({
      vertexai: true,
      project: config.gcp.projectId,
      location: config.gcp.location,
    });
  }
  return client;
}

export function isGeminiConfigured(): boolean {
  return Boolean(config.gcp.projectId);
}
