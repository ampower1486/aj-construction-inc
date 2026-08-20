/**
 * Service list used by the quote form and the project assistant.
 *
 * The prose descriptions live in the HTML (with data-i18n keys) so the services
 * grid is crawlable without JavaScript. This file carries only what the
 * interactive flows need: a stable id, a label key, and the follow-up questions
 * that are worth asking for that trade.
 *
 * Source: the company's own Facebook description —
 *   "All Type of Remodels, Bathrooms, Flooring, Drywall, New builds,
 *    New additions, Concrete and Electrical"
 * plus their listed categories (Home Improvement, Roofing, Electrician) and the
 * deck / concrete / exterior work shown in their project photos.
 */

export const SERVICES = [
  { id: 'kitchen', key: 'svc.kitchen', group: 'remodel' },
  { id: 'bathroom', key: 'svc.bathroom', group: 'remodel' },
  { id: 'whole-home', key: 'svc.wholeHome', group: 'remodel' },
  { id: 'addition', key: 'svc.addition', group: 'build' },
  { id: 'new-build', key: 'svc.newBuild', group: 'build' },
  { id: 'deck', key: 'svc.deck', group: 'exterior' },
  { id: 'concrete', key: 'svc.concrete', group: 'exterior' },
  { id: 'roofing', key: 'svc.roofing', group: 'exterior' },
  { id: 'flooring', key: 'svc.flooring', group: 'interior' },
  { id: 'tile', key: 'svc.tile', group: 'interior' },
  { id: 'drywall', key: 'svc.drywall', group: 'interior' },
  { id: 'painting', key: 'svc.painting', group: 'interior' },
  { id: 'electrical', key: 'svc.electrical', group: 'systems' },
  { id: 'repair', key: 'svc.repair', group: 'systems' },
  { id: 'other', key: 'svc.other', group: 'systems' },
];

/** Condensed set offered as first-tap options in the assistant. */
export const TOP_SERVICE_IDS = [
  'bathroom',
  'kitchen',
  'deck',
  'concrete',
  'addition',
  'whole-home',
  'flooring',
  'other',
];

/**
 * Trade-specific follow-up questions. Keeping them beside the service keeps the
 * assistant's conversation graph small — it asks whichever of these apply
 * instead of carrying a hand-written branch per trade.
 */
export const SERVICE_FOLLOWUPS = {
  bathroom: [
    { id: 'bathCount', key: 'q.bathCount', options: ['1', '2', '3+'] },
    { id: 'bathScope', key: 'q.bathScope', optionKeys: ['opt.tubToShower', 'opt.fullGut', 'opt.refresh', 'opt.unsure'] },
    { id: 'waterDamage', key: 'q.waterDamage', optionKeys: ['opt.yes', 'opt.no', 'opt.unsure'] },
  ],
  kitchen: [
    { id: 'kitchenScope', key: 'q.kitchenScope', optionKeys: ['opt.fullGut', 'opt.cabinetsCounters', 'opt.layoutChange', 'opt.unsure'] },
    { id: 'movingWalls', key: 'q.movingWalls', optionKeys: ['opt.yes', 'opt.no', 'opt.unsure'] },
  ],
  deck: [
    { id: 'deckSize', key: 'q.deckSize', optionKeys: ['opt.under200', 'opt.200to500', 'opt.over500', 'opt.unsure'] },
    { id: 'deckState', key: 'q.deckState', optionKeys: ['opt.newDeck', 'opt.replaceDeck', 'opt.repairDeck'] },
    { id: 'deckHeight', key: 'q.deckHeight', optionKeys: ['opt.groundLevel', 'opt.raised', 'opt.multiLevel'] },
  ],
  concrete: [
    { id: 'concreteType', key: 'q.concreteType', optionKeys: ['opt.driveway', 'opt.patio', 'opt.walkway', 'opt.slabFoundation'] },
    { id: 'concreteSize', key: 'q.concreteSize', optionKeys: ['opt.under300', 'opt.300to800', 'opt.over800', 'opt.unsure'] },
    { id: 'truckAccess', key: 'q.truckAccess', optionKeys: ['opt.yes', 'opt.no', 'opt.unsure'] },
  ],
  addition: [
    { id: 'additionType', key: 'q.additionType', optionKeys: ['opt.bedroomBath', 'opt.livingSpace', 'opt.secondStory', 'opt.adu'] },
    { id: 'plansReady', key: 'q.plansReady', optionKeys: ['opt.plansYes', 'opt.plansNo', 'opt.plansHelp'] },
  ],
  'new-build': [
    { id: 'plansReady', key: 'q.plansReady', optionKeys: ['opt.plansYes', 'opt.plansNo', 'opt.plansHelp'] },
    { id: 'lotStatus', key: 'q.lotStatus', optionKeys: ['opt.lotOwned', 'opt.lotBuying', 'opt.lotLooking'] },
  ],
  'whole-home': [
    { id: 'homeSize', key: 'q.homeSize', optionKeys: ['opt.under1500', 'opt.1500to2500', 'opt.over2500'] },
    { id: 'occupied', key: 'q.occupied', optionKeys: ['opt.livingIn', 'opt.vacant'] },
  ],
  flooring: [
    { id: 'floorArea', key: 'q.floorArea', optionKeys: ['opt.oneRoom', 'opt.severalRooms', 'opt.wholeHouse'] },
    { id: 'floorType', key: 'q.floorType', optionKeys: ['opt.hardwood', 'opt.vinylPlank', 'opt.tileFloor', 'opt.unsure'] },
  ],
  roofing: [
    { id: 'roofIssue', key: 'q.roofIssue', optionKeys: ['opt.fullReplace', 'opt.leakRepair', 'opt.inspection'] },
  ],
  electrical: [
    { id: 'electricalScope', key: 'q.electricalScope', optionKeys: ['opt.panelUpgrade', 'opt.newCircuits', 'opt.lighting', 'opt.troubleshoot'] },
  ],
};

/** Words that mean "this cannot wait for an email reply". */
export const URGENT_TERMS = [
  'leak', 'leaking', 'flood', 'flooded', 'flooding', 'burst', 'water damage',
  'no power', 'sparking', 'spark', 'smoke', 'burning', 'fire', 'shock',
  'collapse', 'collapsed', 'sagging', 'structural', 'unsafe', 'emergency',
  'urgent', 'asap', 'right now', 'mold', 'sewage', 'gas smell',
  'fuga', 'inundacion', 'inundación', 'sin luz', 'chispas', 'humo', 'quemado',
  'incendio', 'emergencia', 'urgente', 'colapso', 'moho', 'peligroso',
];
