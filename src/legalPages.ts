// Public information pages required to publish the Meta app. Keep the policy
// aligned with Session, FirestoreSessionStore, and the Vertex AI integrations.
const contact = "privacy@enfluencer.com";
const updated = "November 27, 2026";

function page(title: string, content: string): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${title} for Prashnavalli, the Ram Prashnavali WhatsApp service.">
  <title>${title} | Prashnavalli</title>
  <style>
    :root { color-scheme: light; font-family: system-ui, sans-serif; color: #26352e; background: #faf8f2; }
    * { box-sizing: border-box; }
    body { margin: 0; }
    main { max-width: 760px; margin: 0 auto; padding: 48px 24px; }
    .brand { color: #526248; font-weight: 700; letter-spacing: .04em; }
    h1 { font-size: clamp(2rem, 6vw, 2.8rem); line-height: 1.15; margin-bottom: 12px; }
    h2 { font-size: 1.25rem; margin-top: 32px; }
    p, li { font-size: 1rem; line-height: 1.7; }
    li + li { margin-top: 8px; }
    .date { color: #60685f; }
    a { color: #275b42; text-underline-offset: 3px; overflow-wrap: anywhere; }
    a:focus-visible { outline: 3px solid #a76b20; outline-offset: 4px; }
    nav { display: flex; flex-wrap: wrap; gap: 20px; border-top: 1px solid #d8dbd1; margin-top: 40px; padding-top: 20px; }
  </style>
</head>
<body>
  <main>
    <div class="brand">Prashnavalli</div>
    <h1>${title}</h1>
    <p class="date">Last updated: ${updated}</p>
    ${content}
    <nav aria-label="Privacy information">
      <a href="/privacy">Privacy policy</a>
      <a href="/data-deletion">Data deletion</a>
      <a href="mailto:${contact}">Contact</a>
    </nav>
  </main>
</body>
</html>`;
}

export const privacyPage = page("Privacy policy", `
    <p>Prashnavalli (listed as “Prashnavali App” in Meta) is an experimental
    WhatsApp service that offers Ram Prashnavali readings and spiritual reflection.
    This policy describes how the service handles information when you message it.</p>

    <h2>Information we receive and store</h2>
    <ul>
      <li><strong>WhatsApp information:</strong> your phone number or WhatsApp
      identifier, messages, message identifiers and timestamps. WhatsApp may also
      include your profile display name in incoming message events.</li>
      <li><strong>Session information:</strong> the app stores your user identifier,
      channel, conversation state, current question (including a transcript if you
      use voice), selected square, last answer reference, and session timestamps.</li>
      <li><strong>Voice notes:</strong> if you send audio, the app downloads it
      temporarily to process and transcribe it. The current app does not save the
      original audio to its session database.</li>
      <li><strong>Operational information:</strong> hosting and application logs
      may include request metadata, delivery errors and diagnostic details.</li>
    </ul>

    <h2>How we use information</h2>
    <p>We use this information to continue your session, interpret your question,
    generate and deliver a response, transcribe voice notes when requested, and
    troubleshoot the service. We do not use the app's session data for advertising
    or sell it.</p>

    <h2>Services that process information</h2>
    <p>Meta/WhatsApp processes messages and delivery information. Google Cloud
    hosts the app and its Firestore session database. Google Vertex AI/Gemini
    processes your question and relevant reading context to generate guidance;
    when you send a voice note, it also processes that audio for transcription.
    These providers process information under their own applicable terms and
    policies. Information may be processed in countries other than your own.</p>

    <h2>Retention and deletion</h2>
    <p>The app maintains a session record rather than a complete conversation
    transcript. Session fields can be replaced as the conversation progresses.
    There is currently no automatic expiry for stored sessions: records remain
    until replaced or deleted. Operational logs and provider backups may have
    separate retention periods.</p>
    <p>You can request deletion of the app's stored session information by emailing
    <a href="mailto:${contact}">${contact}</a>. See the
    <a href="/data-deletion">data-deletion instructions</a> for what to include.
    Requests are reviewed manually and may require verification that you control
    the WhatsApp number. Deleting app data does not delete messages already stored
    in your WhatsApp account or records retained independently by providers.</p>

    <h2>Your choices</h2>
    <p>Participation is optional. You can stop messaging the bot at any time and
    choose text instead of voice. Please avoid sharing passwords, payment details,
    identity documents or other information that is unnecessary for a reading.
    AI-generated reflections can be inaccurate and should not be relied on as
    professional medical, legal or financial advice.</p>

    <h2>Questions and policy updates</h2>
    <p>Contact <a href="mailto:${contact}">${contact}</a> with privacy questions
    or requests concerning your information. Changes to this policy will be
    posted on this page with an updated date.</p>`);

export const deletionPage = page("Data deletion", `
    <p>You can request deletion of the session information stored by Prashnavalli,
    the WhatsApp service listed as “Prashnavali App” in Meta.</p>
    <h2>How to request deletion</h2>
    <ol>
      <li>Email <a href="mailto:${contact}?subject=Prashnavalli%20data%20deletion">${contact}</a>
      with the subject <strong>Prashnavalli data deletion</strong>.</li>
      <li>Include the WhatsApp phone number you used, with its country code, and
      state that you want your stored session information deleted.</li>
      <li>We review requests manually and may ask you to verify control of that
      number before deleting the associated record. You do not need to send a
      password, WhatsApp verification code or identity document.</li>
    </ol>
    <h2>What deletion covers</h2>
    <p>Deletion removes the app's session record associated with your number,
    including its stored question or transcript, conversation state, square
    selection, answer reference and session timestamps.</p>
    <p>This does not remove your WhatsApp chat history, information in other
    people's chats, or records retained independently by Meta, Google or their
    backups and operational systems. Requests concerning those records should
    also be directed to the relevant provider.</p>
    <p>Sending another message after deletion may create a new session.</p>`);
