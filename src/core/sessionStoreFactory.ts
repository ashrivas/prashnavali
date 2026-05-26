import { config } from "../config";
import { InMemorySessionStore, type SessionStore } from "./sessionStore";

// Uses Firestore when a GCP project is configured, otherwise an in-memory store
// for local dev. Firestore is imported lazily so local runs don't need the SDK
// to resolve credentials.
export function createSessionStore(): SessionStore {
  if (!config.gcp.projectId) {
    console.log("[session] using in-memory store (no GCP_PROJECT_ID)");
    return new InMemorySessionStore();
  }
  const { FirestoreSessionStore } = require("./firestoreSessionStore");
  console.log("[session] using Firestore store");
  return new FirestoreSessionStore();
}
