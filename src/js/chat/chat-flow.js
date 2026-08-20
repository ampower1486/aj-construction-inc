/**
 * The conversation itself — WHAT the assistant asks, as data.
 *
 * This file holds AJ's domain knowledge: which questions actually matter for a
 * bathroom versus a concrete pour, what a project manager needs to know before
 * quoting, and where a job stops being an enquiry and becomes something someone
 * should be called about today.
 *
 * It deliberately contains no rendering and no transport. Swapping the scripted
 * engine for a Claude-backed one replaces chat-engine.js and leaves this intact
 * as the system prompt's source material.
 */

import { SERVICE_FOLLOWUPS, TOP_SERVICE_IDS, URGENT_TERMS } from '../../data/services.js';

export const FIRST_NODE = 'projectType';

/** Free text that trips the urgency path. */
export function detectUrgent(text) {
  const s = (text || '').toLowerCase();
  return URGENT_TERMS.some((term) => s.includes(term));
}

/**
 * Base conversation. Trade-specific questions are spliced in after the project
 * type is known — see followupNodes().
 */
export const NODES = {
  projectType: {
    field: 'projectType',
    askKey: 'chat.q.projectType',
    type: 'choice',
    optionKeys: TOP_SERVICE_IDS.map((id) => `svc.${toCamel(id)}`),
    optionIds: TOP_SERVICE_IDS,
    allowText: true,
    next: () => 'propertyType',
  },

  propertyType: {
    field: 'propertyType',
    askKey: 'chat.q.propertyType',
    type: 'choice',
    optionKeys: ['chat.o.ownHome', 'chat.o.rental', 'chat.o.commercial'],
    next: () => 'timeline',
  },

  timeline: {
    field: 'timeline',
    askKey: 'chat.q.timeline',
    type: 'choice',
    optionKeys: [
      'chat.o.asap',
      'chat.o.month',
      'chat.o.quarter',
      'chat.o.halfYear',
      'chat.o.planning',
    ],
    next: () => 'budgetBand',
  },

  budgetBand: {
    field: 'budgetBand',
    askKey: 'chat.q.budget',
    helpKey: 'chat.h.budget',
    type: 'choice',
    optionKeys: [
      'chat.o.b1',
      'chat.o.b2',
      'chat.o.b3',
      'chat.o.b4',
      'chat.o.b5',
      'chat.o.bUnsure',
    ],
    next: () => 'city',
  },

  city: {
    field: 'city',
    askKey: 'chat.q.city',
    type: 'choice',
    optionKeys: [
      'chat.o.placerville',
      'chat.o.eldoradoHills',
      'chat.o.cameronPark',
      'chat.o.shingleSprings',
      'chat.o.folsom',
    ],
    allowText: true,
    next: () => 'details',
  },

  details: {
    field: 'details',
    askKey: 'chat.q.details',
    type: 'text',
    optional: true,
    skipKey: 'chat.o.skip',
    next: () => 'name',
  },

  name: {
    field: 'name',
    askKey: 'chat.q.name',
    type: 'text',
    validate: 'name',
    next: () => 'phone',
  },

  phone: {
    field: 'phone',
    askKey: 'chat.q.phone',
    type: 'phone',
    validate: 'phone',
    next: () => 'email',
  },

  email: {
    field: 'email',
    askKey: 'chat.q.email',
    type: 'email',
    validate: 'email',
    optional: true,
    skipKey: 'chat.o.noEmail',
    next: () => 'contactPreference',
  },

  contactPreference: {
    field: 'contactPreference',
    askKey: 'chat.q.contactPref',
    type: 'choice',
    optionKeys: ['chat.o.prefCall', 'chat.o.prefText', 'chat.o.prefEmail'],
    next: () => 'review',
  },

  review: {
    type: 'review',
    askKey: 'chat.q.review',
    optionKeys: ['chat.o.send', 'chat.o.startOver'],
    next: () => null,
  },
};

/** Convert a service id to the camelCase used by the i18n keys. */
function toCamel(id) {
  return id.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

/**
 * Trade-specific questions for the chosen service, as flow nodes.
 * Each answer lands in `scope`, which the project manager reads as one line.
 */
export function followupNodes(serviceId) {
  const followups = SERVICE_FOLLOWUPS[serviceId];
  if (!followups) return [];

  return followups.map((f, i) => ({
    id: `fu_${serviceId}_${f.id}`,
    serviceId,
    field: `scope:${f.id}`,
    askKey: f.key,
    type: 'choice',
    optionKeys: f.optionKeys || null,
    options: f.options || null,
    allowText: true,
    isFollowup: true,
    followupIndex: i,
  }));
}

export { toCamel };
