import { config } from "../../config";

const GRAPH_VERSION = "v21.0";

export interface DownloadedMedia {
  bytes: Buffer;
  mimeType: string;
}

// Two-step WhatsApp media fetch: resolve the media_id to a short-lived URL,
// then download the bytes. Both calls require the access token. In dev (no
// token) returns empty bytes so the transcription dev fallback takes over.
export async function downloadAudio(mediaId: string): Promise<DownloadedMedia> {
  const { accessToken } = config.whatsapp;
  if (!accessToken) {
    return { bytes: Buffer.alloc(0), mimeType: "audio/ogg" };
  }

  const headers = { Authorization: `Bearer ${accessToken}` };

  const metaRes = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/${mediaId}`,
    { headers },
  );
  if (!metaRes.ok) {
    throw new Error(`media meta fetch failed: ${metaRes.status}`);
  }
  const meta = (await metaRes.json()) as { url: string; mime_type: string };

  const binRes = await fetch(meta.url, { headers });
  if (!binRes.ok) {
    throw new Error(`media download failed: ${binRes.status}`);
  }

  return {
    bytes: Buffer.from(await binRes.arrayBuffer()),
    mimeType: meta.mime_type,
  };
}
