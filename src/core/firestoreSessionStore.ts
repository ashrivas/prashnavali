import { Firestore } from "@google-cloud/firestore";
import type { Channel, Session } from "../types";
import { config } from "../config";
import type { SessionStore } from "./sessionStore";

const COLLECTION = "sessions";

// Firestore-backed store for production. One document per (channel, user),
// keyed the same way as the in-memory store.
export class FirestoreSessionStore implements SessionStore {
  private readonly db: Firestore;

  constructor() {
    this.db = new Firestore({ projectId: config.gcp.projectId });
  }

  private docId(channel: Channel, userId: string): string {
    return `${channel}:${userId}`;
  }

  async get(channel: Channel, userId: string): Promise<Session | null> {
    const snap = await this.db
      .collection(COLLECTION)
      .doc(this.docId(channel, userId))
      .get();
    return snap.exists ? (snap.data() as Session) : null;
  }

  async save(session: Session): Promise<void> {
    await this.db
      .collection(COLLECTION)
      .doc(this.docId(session.channel, session.user_id))
      .set(session);
  }
}
