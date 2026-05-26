import type { Channel, Session } from "../types";

export interface SessionStore {
  get(channel: Channel, userId: string): Promise<Session | null>;
  save(session: Session): Promise<void>;
}

// Local/dev store. Swapped for FirestoreSessionStore once GCP is provisioned.
export class InMemorySessionStore implements SessionStore {
  private readonly map = new Map<string, Session>();

  private key(channel: Channel, userId: string): string {
    return `${channel}:${userId}`;
  }

  async get(channel: Channel, userId: string): Promise<Session | null> {
    return this.map.get(this.key(channel, userId)) ?? null;
  }

  async save(session: Session): Promise<void> {
    this.map.set(this.key(session.channel, session.user_id), { ...session });
  }
}
