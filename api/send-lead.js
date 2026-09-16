/**
 * Serverless function behind VITE_FORM_ENDPOINT.
 *
 * The quote form and the assistant (src/js/lead-service.js) POST a JSON lead
 * straight from the browser. This function is the one place that holds the
 * Resend API key and actually sends the email — the key must never reach
 * client-side code (anyone could read it out of the built JS and send email
 * as this account), so this runs server-side only, on Vercel.
 *
 * Required env vars (set in Vercel, never prefixed VITE_ — that prefix is
 * inlined into the client bundle by Vite, which is exactly what a secret
 * must avoid):
 *   RESEND_API_KEY   from resend.com/api-keys
 *
 * Optional:
 *   LEAD_TO_EMAIL    defaults to AJ Construction's inbox below
 *   LEAD_FROM_EMAIL  defaults to a verified-domain sender below — this
 *                    address's domain must be verified in Resend, or
 *                    sending fails
 */

const TO_EMAIL = process.env.LEAD_TO_EMAIL || 'aj.construction.inc2@gmail.com';
const FROM_EMAIL =
  process.env.LEAD_FROM_EMAIL || 'AJ Construction Website <estimates@ajconstructionplacerville.com>';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, reason: 'method_not_allowed' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ ok: false, reason: 'unconfigured' });
  }

  const lead = req.body || {};

  // A lead built by lead-service.js always carries these — a request without
  // them either isn't from our own form or is malformed either way.
  if (!lead.summary || !lead._subject || !['quote-form', 'assistant'].includes(lead.source)) {
    return res.status(400).json({ ok: false, reason: 'bad_payload' });
  }

  try {
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [TO_EMAIL],
        subject: lead._subject,
        text: lead.summary,
      }),
    });

    if (!resendRes.ok) {
      const detail = await resendRes.text().catch(() => '');
      console.error('Resend rejected the lead email', resendRes.status, detail);
      return res.status(502).json({ ok: false, reason: 'send_failed' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Resend request failed', err);
    return res.status(502).json({ ok: false, reason: 'network' });
  }
}
