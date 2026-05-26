import { transcribeAudio } from "../../core/transcription";
import { downloadAudio } from "./media";

// Bridges the WhatsApp media API and the channel-agnostic transcription
// service: download the voice note, then transcribe it.
export async function transcribeWhatsAppAudio(mediaId: string): Promise<string> {
  const { bytes, mimeType } = await downloadAudio(mediaId);
  return transcribeAudio(bytes, mimeType);
}
