/**
 * The driver — HOW the conversation advances.
 *
 * ScriptedEngine walks the node graph in chat-flow.js. It needs no backend, no
 * API key, and no per-message cost, and it works on plain static hosting.
 *
 * The interface below is the seam. A ClaudeEngine that POSTs to a serverless
 * function can implement the same three methods and drop straight in — the UI
 * and the lead pipeline never learn which one they are talking to.
 *
 *   start()        -> Turn
 *   send(text)     -> Turn
 *   restart()      -> Turn
 *
 *   Turn = {
 *     messages: Array<{ role, text?, html?, kind? }>,
 *     prompt:   { type, options?, placeholder?, allowText?, skip? } | null,
 *     lead:     object,
 *     done:     boolean,
 *   }
 */

import { NODES, FIRST_NODE, followupNodes, detectUrgent, toCamel } from './chat-flow.js';
import { validators, formatPhone, summarize } from '../lead-service.js';
import { t } from '../i18n.js';
import { TOP_SERVICE_IDS } from '../../data/services.js';

export class ScriptedEngine {
  constructor() {
    this.restartState();
  }

  restartState() {
    this.lead = {};
    this.scope = {};
    this.transcript = [];
    // The queue holds only questions inserted ahead of the normal chain (the
    // trade-specific follow-ups). The first question is assigned to `current`
    // directly — leaving it queued would make it come round a second time.
    this.queue = [];
    this.current = null;
    this.urgent = false;
    this.retries = 0;
  }

  /* --- Node access ------------------------------------------------------- */

  resolveNode(ref) {
    return typeof ref === 'string' ? { id: ref, ...NODES[ref] } : ref;
  }

  advanceQueue() {
    // Anything queued ahead of the chain wins; otherwise follow the node's own
    // link. Generated follow-up nodes have no next() of their own — the node to
    // resume at is pushed onto the queue behind them when they are inserted.
    if (this.queue.length) return this.resolveNode(this.queue.shift());
    if (!this.current) return null;

    const next = this.current.next?.(this.lead);
    return next ? this.resolveNode(next) : null;
  }

  /* --- Prompt shape the UI renders --------------------------------------- */

  promptFor(node) {
    if (!node) return null;

    if (node.type === 'review') {
      return {
        type: 'review',
        options: node.optionKeys.map((k, i) => ({
          label: t(k),
          value: i === 0 ? '__send__' : '__restart__',
          primary: i === 0,
        })),
        allowText: false,
      };
    }

    if (node.type === 'choice') {
      const labels = node.optionKeys
        ? node.optionKeys.map((k) => t(k))
        : node.options || [];

      return {
        type: 'choice',
        options: labels.map((label, i) => ({
          label,
          value: label,
          id: node.optionIds?.[i],
        })),
        allowText: Boolean(node.allowText),
        placeholder: t('chat.placeholder.type'),
      };
    }

    return {
      type: node.type, // text | phone | email
      allowText: true,
      placeholder: t(`chat.placeholder.${node.type}`, t('chat.placeholder.type')),
      skip: node.optional ? { label: t(node.skipKey || 'chat.o.skip'), value: '__skip__' } : null,
    };
  }

  askMessages(node) {
    const out = [{ role: 'bot', text: t(node.askKey) }];
    if (node.helpKey) out.push({ role: 'bot', text: t(node.helpKey), kind: 'help' });
    return out;
  }

  /* --- Turns ------------------------------------------------------------- */

  start() {
    this.restartState();
    this.current = this.resolveNode(FIRST_NODE);

    const messages = [
      { role: 'bot', text: t('chat.greeting') },
      ...this.askMessages(this.current),
    ];
    messages.forEach((m) => this.transcript.push(m));

    return { messages, prompt: this.promptFor(this.current), lead: this.lead, done: false };
  }

  restart() {
    return this.start();
  }

  send(raw) {
    const text = (raw || '').trim();
    if (!text) return { messages: [], prompt: this.promptFor(this.current), lead: this.lead, done: false };

    this.transcript.push({ role: 'user', text });
    const node = this.current;
    const messages = [];

    /* --- Review step: send or start over --- */
    if (node?.type === 'review') {
      if (text === '__restart__') return this.restart();
      return {
        messages: [{ role: 'bot', text: t('chat.sending') }],
        prompt: null,
        lead: this.finalLead(),
        done: true,
      };
    }

    /* --- Skip an optional question --- */
    if (text === '__skip__') {
      this.retries = 0;
      return this.moveOn(messages);
    }

    /* --- Validate --- */
    if (node?.validate) {
      const problem = validators[node.validate]?.(text, { required: !node.optional });
      if (problem) {
        this.retries += 1;
        messages.push({ role: 'bot', text: t(problem), kind: 'retry' });

        // Never trap someone in a validation loop — offer the phone instead.
        if (this.retries >= 3) {
          messages.push({ role: 'bot', text: t('chat.stuck'), kind: 'alert' });
          this.retries = 0;
        }
        return { messages, prompt: this.promptFor(node), lead: this.lead, done: false };
      }
    }

    this.retries = 0;

    /* --- Record the answer --- */
    const value = node.type === 'phone' ? formatPhone(text) : text;

    if (node.field?.startsWith('scope:')) {
      this.scope[node.field.slice(6)] = value;
    } else if (node.field) {
      this.lead[node.field] = value;
    }

    /* --- Urgency: escalate but keep going --- */
    if (!this.urgent && detectUrgent(text)) {
      this.urgent = true;
      messages.push({ role: 'bot', kind: 'alert', html: t('chat.urgent') });
    }

    /* --- Choosing a trade splices in that trade's questions --- */
    if (node.id === 'projectType') {
      const id = this.matchService(text);
      this.lead.serviceId = id;

      const followups = followupNodes(id);
      if (followups.length) {
        // Queue the trade questions, then the node the main chain resumes at,
        // so the conversation rejoins it once the trade questions run out.
        this.queue.unshift(...followups, node.next(this.lead));
      }
    }

    return this.moveOn(messages);
  }

  moveOn(messages) {
    const next = this.advanceQueue();
    this.current = next;

    if (!next) {
      return { messages, prompt: null, lead: this.finalLead(), done: true };
    }

    if (next.type === 'review') {
      const lead = this.finalLead();
      messages.push({ role: 'bot', text: t('chat.q.review') });
      messages.push({ role: 'bot', kind: 'summary', summary: summarize(lead) });
    } else {
      messages.push(...this.askMessages(next));
    }

    messages.forEach((m) => this.transcript.push(m));
    return { messages, prompt: this.promptFor(next), lead: this.lead, done: false };
  }

  /** Map whatever the visitor typed or tapped onto a known service id. */
  matchService(text) {
    const s = text.toLowerCase();

    for (const id of TOP_SERVICE_IDS) {
      if (t(`svc.${toCamel(id)}`).toLowerCase() === s) return id;
    }

    const hints = {
      bathroom: ['bath', 'shower', 'tub', 'toilet', 'vanity', 'baño', 'bano', 'regadera', 'ducha'],
      kitchen: ['kitchen', 'cabinet', 'countertop', 'cocina', 'gabinete'],
      deck: ['deck', 'porch', 'patio cover', 'railing', 'terraza', 'balcon', 'balcón'],
      concrete: ['concrete', 'driveway', 'slab', 'walkway', 'sidewalk', 'foundation', 'concreto', 'cemento', 'banqueta'],
      addition: ['addition', 'add a room', 'extend', 'adu', 'ampliacion', 'ampliación'],
      'whole-home': ['whole home', 'whole house', 'full remodel', 'casa completa', 'remodelacion completa'],
      flooring: ['floor', 'hardwood', 'laminate', 'vinyl', 'piso', 'suelo'],
      roofing: ['roof', 'shingle', 'techo', 'tejado'],
      electrical: ['electric', 'panel', 'wiring', 'outlet', 'electrico', 'eléctrico', 'cableado'],
      tile: ['tile', 'backsplash', 'azulejo', 'loseta'],
      drywall: ['drywall', 'sheetrock', 'tablaroca', 'yeso'],
      painting: ['paint', 'pintura', 'pintar'],
      'new-build': ['new build', 'new home', 'ground up', 'construir', 'casa nueva'],
    };

    for (const [id, words] of Object.entries(hints)) {
      if (words.some((w) => s.includes(w))) return id;
    }
    return 'other';
  }

  /* --- Persistence -------------------------------------------------------
     The queue can hold generated follow-up nodes, which are not JSON-safe. They
     are deterministic given the service id though, so we store a reference and
     rebuild them on restore. */

  static refFor(node) {
    if (!node) return null;
    if (node.isFollowup) {
      return { kind: 'fu', serviceId: node.serviceId, index: node.followupIndex };
    }
    return { kind: 'base', id: node.id };
  }

  derefNode(ref) {
    if (!ref) return null;
    if (ref.kind === 'base') return this.resolveNode(ref.id);
    const generated = followupNodes(ref.serviceId);
    return generated[ref.index] || null;
  }

  /** Re-derive the prompt for the question currently on screen. */
  currentPrompt() {
    return this.promptFor(this.current);
  }

  serialize() {
    return {
      v: 1,
      lead: this.lead,
      scope: this.scope,
      transcript: this.transcript.filter((m) => m.text).map(({ role, text }) => ({ role, text })),
      urgent: this.urgent,
      current: ScriptedEngine.refFor(this.current),
      queue: this.queue.map((n) => ScriptedEngine.refFor(this.resolveNode(n))),
    };
  }

  static deserialize(data) {
    if (!data || data.v !== 1) throw new Error('unsupported chat state');

    const engine = new ScriptedEngine();
    engine.lead = data.lead || {};
    engine.scope = data.scope || {};
    engine.transcript = data.transcript || [];
    engine.urgent = Boolean(data.urgent);
    engine.queue = (data.queue || []).map((ref) => engine.derefNode(ref)).filter(Boolean);
    engine.current = engine.derefNode(data.current);

    if (!engine.current) throw new Error('chat state has no current question');
    return engine;
  }

  /**
   * Flatten trade answers into one readable `scope` line for the email.
   * Each answer keeps its own short label — a bare "2 · Full gut · No" tells the
   * project manager nothing, whereas "Bathrooms: 2 · Water damage: No" does.
   */
  finalLead() {
    const scopeText = Object.entries(this.scope)
      .filter(([, v]) => v)
      .map(([id, v]) => `${t(`lbl.${id}`, id)}: ${v}`)
      .join(' · ');

    return {
      ...this.lead,
      scope: scopeText || undefined,
      urgent: this.urgent,
      transcript: this.transcript
        .filter((m) => m.text)
        .map(({ role, text }) => ({ role, text })),
    };
  }
}

/**
 * Placeholder for the AI upgrade.
 *
 *   1. Add api/chat.js (Vercel/Netlify function) that calls Claude with a system
 *      prompt built from src/data/services.js plus the lead schema.
 *   2. Set ANTHROPIC_API_KEY on the host and VITE_CHAT_ENGINE=claude locally.
 *   3. Implement start/send/restart below against that endpoint.
 *
 * Nothing in chat-ui.js or lead-service.js needs to change.
 */
export function createEngine() {
  return new ScriptedEngine();
}
