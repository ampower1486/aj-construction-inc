/**
 * The single exit point for every lead on the site.
 *
 * Both the quote form and the project assistant hand their answers here, so
 * there is exactly one schema, one delivery path, and one failure story to
 * reason about. If delivery is not configured or the network call fails, the
 * visitor is offered a pre-filled email instead — a lead is never silently
 * dropped on the floor.
 */

import { SITE } from '../data/site.js';
import { t } from './i18n.js';

/**
 * @typedef {Object} Lead
 * @property {'quote-form'|'assistant'} source
 * @property {string}  name
 * @property {string}  phone
 * @property {string} [email]
 * @property {string} [city]
 * @property {string}  projectType
 * @property {string} [scope]
 * @property {string} [timeline]
 * @property {string} [budgetBand]
 * @property {string} [propertyType]
 * @property {string} [details]
 * @property {string} [contactPreference]
 * @property {boolean}[urgent]
 * @property {Array}  [transcript]
 * @property {string}  locale
 * @property {string}  submittedAt
 */

const FIELD_ORDER = [
  'projectType',
  'scope',
  'propertyType',
  'timeline',
  'budgetBand',
  'city',
  'details',
  'name',
  'phone',
  'email',
  'contactPreference',
];

const LABEL_KEYS = {
  projectType: 'lead.projectType',
  scope: 'lead.scope',
  propertyType: 'lead.propertyType',
  timeline: 'lead.timeline',
  budgetBand: 'lead.budget',
  city: 'lead.city',
  details: 'lead.details',
  name: 'lead.name',
  phone: 'lead.phone',
  email: 'lead.email',
  contactPreference: 'lead.contactPref',
};

export function labelFor(field) {
  return t(LABEL_KEYS[field] || field, field);
}

/** Ordered [label, value] pairs, skipping anything empty. */
export function summarize(lead) {
  return FIELD_ORDER.filter((f) => lead[f] != null && String(lead[f]).trim() !== '').map((f) => [
    labelFor(f),
    String(lead[f]).trim(),
  ]);
}

function plainText(lead) {
  const lines = [
    `NEW ${lead.source === 'assistant' ? 'ASSISTANT' : 'WEBSITE'} LEAD — ${SITE.name}`,
    '='.repeat(52),
    '',
  ];

  if (lead.urgent) {
    lines.push('*** MARKED URGENT BY THE VISITOR — CALL FIRST ***', '');
  }

  summarize(lead).forEach(([label, value]) => {
    lines.push(`${label}: ${value}`);
  });

  lines.push('', '-'.repeat(52));
  lines.push(`Submitted: ${new Date(lead.submittedAt).toLocaleString('en-US')}`);
  lines.push(`Language: ${lead.locale === 'es' ? 'Spanish' : 'English'}`);
  lines.push(`Page: ${lead.pageUrl || location.href}`);

  if (lead.transcript?.length) {
    lines.push('', 'CONVERSATION', '-'.repeat(52));
    lead.transcript.forEach((m) => {
      lines.push(`${m.role === 'user' ? 'Customer' : 'Assistant'}: ${m.text}`);
    });
  }

  return lines.join('\n');
}

function subjectFor(lead) {
  const flag = lead.urgent ? '[URGENT] ' : '';
  const who = lead.name ? ` — ${lead.name}` : '';
  return `${flag}New lead: ${lead.projectType || 'Project enquiry'}${who}`;
}

/** A pre-filled mail client link — the fallback when the network path fails. */
export function mailtoFor(lead) {
  const params = new URLSearchParams({
    subject: subjectFor(lead),
    body: plainText(lead),
  });
  return `mailto:${SITE.email}?${params.toString()}`;
}

export function buildLead(fields, source) {
  return {
    source,
    locale: document.documentElement.lang || 'en',
    submittedAt: new Date().toISOString(),
    pageUrl: location.href,
    ...fields,
  };
}

/**
 * Deliver a lead.
 * @returns {Promise<{ok: boolean, fallback?: string, reason?: string}>}
 */
export async function submitLead(lead) {
  const endpoint = SITE.formEndpoint;

  if (!endpoint) {
    return { ok: false, reason: 'unconfigured', fallback: mailtoFor(lead) };
  }

  const payload = {
    _subject: subjectFor(lead),
    ...Object.fromEntries(summarize(lead).map(([label, value]) => [label, value])),
    source: lead.source,
    urgent: lead.urgent ? 'YES' : 'no',
    language: lead.locale,
    page: lead.pageUrl,
    submittedAt: lead.submittedAt,
    summary: plainText(lead),
  };

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      return { ok: false, reason: `http_${res.status}`, fallback: mailtoFor(lead) };
    }
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      reason: err.name === 'AbortError' ? 'timeout' : 'network',
      fallback: mailtoFor(lead),
    };
  }
}

/* --- Validation shared by the form and the assistant --------------------- */

export const validators = {
  name(v) {
    const s = (v || '').trim();
    if (s.length < 2) return 'err.name';
    return null;
  },
  phone(v) {
    const digits = (v || '').replace(/\D/g, '');
    // 10 digits, or 11 starting with a US country code.
    if (digits.length === 10) return null;
    if (digits.length === 11 && digits.startsWith('1')) return null;
    return 'err.phone';
  },
  email(v, { required = false } = {}) {
    const s = (v || '').trim();
    if (!s) return required ? 'err.emailRequired' : null;
    return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(s) ? null : 'err.email';
  },
  required(v) {
    return (v || '').trim() ? null : 'err.required';
  },
};

/** (916) 532-3015 as the visitor types. */
export function formatPhone(value) {
  const d = (value || '').replace(/\D/g, '').slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}
