import type { Channel, Session } from "../types";
import type { SessionStore } from "./sessionStore";

function newSession(channel: Channel, userId: string): Session {
  const now = Date.now();
  return {
    user_id: userId,
    channel,
    experience: null,
    state: "IDLE",
    question: null,
    square: null,
    last_answer_id: null,
    created_at: now,
    updated_at: now,
  };
}

export class SessionManager {
  constructor(private readonly store: SessionStore) {}

  async loadOrCreate(channel: Channel, userId: string): Promise<Session> {
    return (await this.store.get(channel, userId)) ?? newSession(channel, userId);
  }

  async save(session: Session): Promise<void> {
    session.updated_at = Date.now();
    await this.store.save(session);
  }
}
