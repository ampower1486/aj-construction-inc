/**
 * English strings that exist only in JavaScript.
 *
 * Copy that lives in the HTML is NOT repeated here — i18n.js snapshots it from
 * the DOM at boot, so there is one place to edit page copy and no risk of the
 * markup and a dictionary drifting apart. This file covers the assistant,
 * gallery captions, validation messages and form status text.
 */

export const EN = {
  /* --- Services (shared by the assistant and the quote form) --- */
  'svc.kitchen': 'Kitchen Remodeling',
  'svc.bathroom': 'Bathroom Remodeling',
  'svc.wholeHome': 'Whole-Home Remodel',
  'svc.addition': 'Home Addition',
  'svc.newBuild': 'New Build',
  'svc.deck': 'Deck / Outdoor Living',
  'svc.concrete': 'Concrete',
  'svc.roofing': 'Roofing',
  'svc.flooring': 'Flooring',
  'svc.tile': 'Tile',
  'svc.drywall': 'Drywall',
  'svc.painting': 'Painting',
  'svc.electrical': 'Electrical',
  'svc.repair': 'Repair',
  'svc.other': 'Something else',

  /* --- Gallery --- */
  'gal.all': 'All work',
  'gal.kitchensBaths': 'Kitchens & Baths',
  'gal.decks': 'Decks & Patios',
  'gal.concrete': 'Concrete',
  'gal.roofing': 'Roofing',
  'gal.exterior': 'Exterior',
  'gal.openLabel': 'open larger',
  'gal.lightboxLabel': 'Project photo viewer',
  'gal.close': 'Close',
  'gal.prev': 'Previous photo',
  'gal.next': 'Next photo',
  'gal.videoTitle': 'AJ Construction project video',
  'gal.empty': 'No projects in this category yet.',

  /* JS-only: the video cards are rendered from the manifest, so this label has
     no markup for i18n.js to snapshot English from. */
  'gp.watch': 'Watch video',

  /* Photo titles and captions. Keys match the slug in gallery-manifest.js. */
  'gal.kitchen-remodel-quartz-island.title': 'Kitchen Remodel — Quartz Waterfall Island',
  'gal.kitchen-remodel-quartz-island.caption':
    'A full kitchen rebuild in white shaker cabinetry with a quartz waterfall island, new flooring, and the plumbing and electrical reworked behind the walls.',
  'gal.backyard-spa-walkway.title': 'Backyard Spa & Concrete Walkway',
  'gal.backyard-spa-walkway.caption':
    'A finished backyard: spa set on its own pad, a broom-finished concrete walkway wrapping the water feature, and fresh landscaping tied in around it.',
  'gal.bathroom-double-vanity-shower.title': 'Bathroom Remodel — Double Vanity',
  'gal.bathroom-double-vanity-shower.caption':
    'A double vanity with a framed mirror wall and a curbless walk-in tile shower, fully waterproofed before a single tile went on.',
  'gal.redwood-deck-boulders.title': 'Redwood Deck — Finished',
  'gal.redwood-deck-boulders.caption':
    'A finished redwood deck built into a granite boulder outcrop, with the railing and stair run set to match the natural grade.',
  'gal.covered-patio-lighting.title': 'Covered Patio with Recessed Lighting',
  'gal.covered-patio-lighting.caption':
    'A solid patio cover over a poured concrete slab, finished with a clean ceiling and recessed lighting wired to code.',
  'gal.concrete-driveway-poured.title': 'Concrete Driveway',
  'gal.concrete-driveway-poured.caption':
    'A full driveway pour with control joints cut on the grid, graded to carry water away from the house.',
  'gal.bathroom-tile-tub-surround.title': 'Bathroom — Tile Tub Surround',
  'gal.bathroom-tile-tub-surround.caption':
    'A floor-to-ceiling tile tub surround over a slate-look floor, with the niche and edges set square and grouted clean.',
  'gal.poolside-patio-cover.title': 'Poolside Patio Cover',
  'gal.poolside-patio-cover.caption':
    'A patio cover and concrete deck poured alongside an existing pool, giving the yard shade and a level surface end to end.',
  'gal.redwood-deck-multi-level.title': 'Multi-Level Redwood Deck',
  'gal.redwood-deck-multi-level.caption':
    'A multi-level redwood deck stepping down with the slope, sized for an outdoor table and a full seating area.',
  'gal.shingle-roof-replacement.title': 'Roof Replacement — Architectural Shingle',
  'gal.shingle-roof-replacement.caption':
    'A complete tear-off and re-roof in architectural shingle, with new underlayment, flashing and ridge vent throughout.',
  'gal.concrete-slab-finished.title': 'Finished Concrete Slab',
  'gal.concrete-slab-finished.caption':
    'A poured and finished slab photographed at the end of the day, edges cut and surface floated smooth.',
  'gal.tile-floor-installation.title': 'Tile Floor Installation',
  'gal.tile-floor-installation.caption':
    'Large-format tile going down on a levelled substrate, set with leveling clips so every edge comes out flat and lippage-free.',
  'gal.cedar-fence-and-gate.title': 'Cedar Fence & Gate',
  'gal.cedar-fence-and-gate.caption':
    'A cedar privacy fence and matching gate stepped down a sloped property line, posts set in concrete.',
  'gal.block-retaining-wall.title': 'Block Retaining Wall',
  'gal.block-retaining-wall.caption':
    'A block retaining wall and raised planter built out to the street, holding back grade and squaring off the frontage.',
  'gal.shingle-roof-aerial.title': 'New Roof — Overhead',
  'gal.shingle-roof-aerial.caption':
    'An overhead look at a finished shingle roof, showing clean course lines and properly lapped valleys.',
  'gal.concrete-steps-hillside.title': 'Concrete Steps',
  'gal.concrete-steps-hillside.caption':
    'Poured concrete steps climbing a hillside lot, formed with even risers so the run is safe to walk in the dark.',
  'gal.fence-replacement-before.title': 'Fence Replacement — Before',
  'gal.fence-replacement-before.caption':
    'The original fence: posts rotted at grade and whole sections down. This is what the homeowner called us about.',
  'gal.fence-replacement-after.title': 'Fence Replacement — After',
  'gal.fence-replacement-after.caption':
    'The same property line rebuilt straight and plumb, with the yard opened back up and the cypress line cleared.',
  'gal.ranch-home-exterior.title': 'Ranch Home Exterior',
  'gal.ranch-home-exterior.caption':
    'A single-storey ranch home after exterior work, with the lawn and frontage brought back in around it.',
  'gal.poolside-home-roof-work.title': 'Two-Storey Re-Roof',
  'gal.poolside-home-roof-work.caption':
    'Roof work under way on a two-storey home, staged and loaded so the pool and yard below stayed clear.',
  'gal.hillside-deck-framing.title': 'Hillside Deck Framing',
  'gal.hillside-deck-framing.caption':
    'Deck framing over a rocky hillside, every post carried down to its own footing and the frame brought dead level.',
  'gal.deck-joist-framing.title': 'Deck Joist Framing',
  'gal.deck-joist-framing.caption':
    'Joists laid out on 16-inch centres and blocked, ready for decking to go down.',
  'gal.hillside-home-deck-framing.title': 'Foothill Home — Deck in Progress',
  'gal.hillside-home-deck-framing.caption':
    'A new deck taking shape off the back of a foothill home, tied into the existing structure with proper ledger flashing.',
  'gal.poolside-addition-framing.title': 'Home Addition — Framed',
  'gal.poolside-addition-framing.caption':
    'A new addition framed and standing poolside, roof line matched to the original house before sheathing goes on.',
  'gal.stair-framing-retaining-wall.title': 'Stair Framing & Retaining Wall',
  'gal.stair-framing-retaining-wall.caption':
    'Cut stair stringers set against a new block retaining wall, connecting two grades on a sloped lot.',
  'gal.concrete-forms-rebar.title': 'Forms & Rebar',
  'gal.concrete-forms-rebar.caption':
    'Curved forms staked out and rebar tied on chairs, inspected and ready for a pour.',
  'gal.concrete-pour-in-progress.title': 'Concrete Pour in Progress',
  'gal.concrete-pour-in-progress.caption':
    'Placing and screeding concrete on a hillside pour, working the surface before it sets up.',
  'gal.slab-prep-grading-crew.title': 'Slab Prep & Grading',
  'gal.slab-prep-grading-crew.caption':
    'The crew grading and compacting base at dusk, getting the pad flat and true before any concrete arrives.',
  'gal.concrete-crew-mixer-truck.title': 'Pour Day',
  'gal.concrete-crew-mixer-truck.caption':
    'Mixer truck on site and the crew placing concrete — the part of the job that only goes well if the prep did.',

  /* Video titles. Keys match the slug in gallery-manifest.js. */
  'gal.v.roofing-crew': 'Roofing crew on a tear-off and re-roof',
  'gal.v.bathroom-remodel-finished': 'Finished bathroom remodel — walkthrough',
  'gal.v.deck-patio-cover': 'Finished deck and patio cover',
  'gal.v.stairs-vinyl-plank-finished': 'Finished stairs and vinyl plank flooring',
  'gal.v.concrete-slab-walkthrough': 'Finished concrete slab — walkthrough',
  'gal.v.concrete-walkway-finished': 'Finished concrete walkway',

  /* --- Lead field labels (used in emails and summaries) --- */
  'lead.projectType': 'Project',
  'lead.scope': 'Scope',
  'lead.propertyType': 'Property',
  'lead.timeline': 'Timeline',
  'lead.budget': 'Budget',
  'lead.city': 'City',
  'lead.details': 'Details',
  'lead.name': 'Name',
  'lead.phone': 'Phone',
  'lead.email': 'Email',
  'lead.contactPref': 'Prefers',

  /* --- Validation --- */
  'err.name': 'Please enter your name.',
  'err.phone': 'Please enter a 10-digit phone number.',
  'err.email': 'That email address does not look right.',
  'err.emailRequired': 'Please enter your email address.',
  'err.required': 'This one is required.',
  'err.choose': 'Please pick an option to continue.',
  'err.tooFast': 'That was submitted very quickly — please take a moment and try again.',

  /* --- Quote form --- */
  'quote.sending': 'Sending…',
  'quote.reviewEmpty': 'Nothing to review yet.',
  'quote.errUnconfigured':
    'This form is not connected to email delivery yet.',
  'quote.errNetwork':
    'We could not send that just now.',
  'quote.errFallbackLink': 'Send it as an email instead',

  /* --- Assistant: shell --- */
  'chat.launcher': 'Start My Project',
  'chat.title': 'Project Assistant',
  'chat.subtitle': 'AJ Construction · replies right away',
  'chat.close': 'Close the assistant',
  'chat.send': 'Send',
  'chat.inputLabel': 'Your message',
  'chat.privacy': 'Your details go straight to our project manager.',
  'chat.placeholder.type': 'Type your answer…',
  'chat.placeholder.text': 'Type your answer…',
  'chat.placeholder.phone': '(916) 555-0123',
  'chat.placeholder.email': 'you@example.com',
  'chat.summaryTitle': "Here is what I have:",

  /* --- Assistant: conversation --- */
  'chat.greeting':
    "Hi — I'm the project assistant for AJ Construction. A few quick questions and I'll get your details straight to our project manager.",
  'chat.q.projectType': 'What are you looking to have done?',
  'chat.q.propertyType': 'And is this for a home you own, a rental, or a commercial property?',
  'chat.q.timeline': 'When are you hoping to get started?',
  'chat.q.budget': 'Do you have a budget range in mind?',
  'chat.h.budget':
    "This just helps us bring the right options to the walkthrough — it isn't a commitment.",
  'chat.q.city': 'Which city is the property in?',
  'chat.q.details':
    'Anything else worth knowing? Age of the house, what is going wrong, what you have already tried — whatever helps.',
  'chat.q.name': 'Got it. What name should we put on the estimate?',
  'chat.q.phone': 'Best phone number to reach you on?',
  'chat.q.email': "And an email address? (Say 'skip' if you'd rather not.)",
  'chat.q.contactPref': 'How would you rather we get back to you?',
  'chat.q.review': 'That is everything. Have a look before I send it over.',

  'chat.o.ownHome': 'My own home',
  'chat.o.rental': 'A rental property',
  'chat.o.commercial': 'Commercial',
  'chat.o.asap': 'As soon as possible',
  'chat.o.month': 'Within a month',
  'chat.o.quarter': '1–3 months',
  'chat.o.halfYear': '3–6 months',
  'chat.o.planning': 'Just planning for now',
  'chat.o.b1': 'Under $5,000',
  'chat.o.b2': '$5,000 – $15,000',
  'chat.o.b3': '$15,000 – $40,000',
  'chat.o.b4': '$40,000 – $100,000',
  'chat.o.b5': '$100,000+',
  'chat.o.bUnsure': 'Not sure yet',
  'chat.o.placerville': 'Placerville',
  'chat.o.eldoradoHills': 'El Dorado Hills',
  'chat.o.cameronPark': 'Cameron Park',
  'chat.o.shingleSprings': 'Shingle Springs',
  'chat.o.folsom': 'Folsom',
  'chat.o.skip': 'Skip this',
  'chat.o.noEmail': 'No email, thanks',
  'chat.o.prefCall': 'Call me',
  'chat.o.prefText': 'Text me',
  'chat.o.prefEmail': 'Email me',
  'chat.o.send': 'Send it to the project manager',
  'chat.o.startOver': 'Start over',

  'chat.sending': 'Sending it over…',
  'chat.sentTitle': 'Sent — thank you.',
  'chat.sentBody':
    'Our project manager has your details and will be in touch, usually within one business day. If it is urgent, call us directly:',
  'chat.fallbackTitle': 'One more step.',
  'chat.fallbackBody':
    "I couldn't send that automatically. Your answers are saved below — send them straight across with either of these:",
  'chat.fallbackEmail': 'Email my project details',
  'chat.urgent':
    "<strong>That sounds like it shouldn't wait.</strong> Please call us now on <a href=\"tel:+19165323015\">(916) 532-3015</a> — we are open 24/7. I'll keep taking your details in the meantime.",
  'chat.stuck':
    'Let us not get stuck on this — call (916) 532-3015 and we will take it down for you directly.',

  /* --- Trade follow-up questions --- */
  'q.bathCount': 'How many bathrooms are we talking about?',
  'q.bathScope': 'What kind of job is it?',
  'q.waterDamage': 'Any sign of water damage — soft floor, stains, smell?',
  'q.kitchenScope': 'How far are you taking it?',
  'q.movingWalls': 'Are any walls moving, or is the layout staying put?',
  'q.deckSize': 'Roughly how big is the deck?',
  'q.deckState': 'Is this a new deck, a replacement, or a repair?',
  'q.deckHeight': 'How high off the ground does it sit?',
  'q.concreteType': 'What are we pouring?',
  'q.concreteSize': 'Roughly how many square feet?',
  'q.truckAccess': 'Can a concrete truck get reasonably close to the pour?',
  'q.additionType': 'What kind of addition?',
  'q.plansReady': 'Do you already have plans drawn?',
  'q.lotStatus': 'How are you set for the lot?',
  'q.homeSize': 'Roughly how big is the house?',
  'q.occupied': 'Will you be living there during the work?',
  'q.floorArea': 'How much area are we covering?',
  'q.floorType': 'What flooring do you have in mind?',
  'q.roofIssue': 'What is going on with the roof?',
  'q.electricalScope': 'What kind of electrical work?',

  /* Short labels for trade answers, used in the lead summary and the email. */
  'lbl.bathCount': 'Bathrooms',
  'lbl.bathScope': 'Job type',
  'lbl.waterDamage': 'Water damage',
  'lbl.kitchenScope': 'Job type',
  'lbl.movingWalls': 'Moving walls',
  'lbl.deckSize': 'Deck size',
  'lbl.deckState': 'Deck job',
  'lbl.deckHeight': 'Deck height',
  'lbl.concreteType': 'Pour type',
  'lbl.concreteSize': 'Area',
  'lbl.truckAccess': 'Truck access',
  'lbl.additionType': 'Addition type',
  'lbl.plansReady': 'Plans',
  'lbl.lotStatus': 'Lot',
  'lbl.homeSize': 'House size',
  'lbl.occupied': 'Occupied',
  'lbl.floorArea': 'Area',
  'lbl.floorType': 'Flooring',
  'lbl.roofIssue': 'Roof issue',
  'lbl.electricalScope': 'Electrical work',

  'opt.yes': 'Yes',
  'opt.no': 'No',
  'opt.unsure': 'Not sure',
  'opt.tubToShower': 'Tub-to-shower conversion',
  'opt.fullGut': 'Full gut and rebuild',
  'opt.refresh': 'Cosmetic refresh',
  'opt.cabinetsCounters': 'Cabinets and counters',
  'opt.layoutChange': 'Changing the layout',
  'opt.under200': 'Under 200 sq ft',
  'opt.200to500': '200–500 sq ft',
  'opt.over500': 'Over 500 sq ft',
  'opt.newDeck': 'Brand new deck',
  'opt.replaceDeck': 'Replacing an old one',
  'opt.repairDeck': 'Repairing what is there',
  'opt.groundLevel': 'Ground level',
  'opt.raised': 'Raised',
  'opt.multiLevel': 'Multi-level',
  'opt.driveway': 'Driveway',
  'opt.patio': 'Patio',
  'opt.walkway': 'Walkway or steps',
  'opt.slabFoundation': 'Slab or foundation',
  'opt.under300': 'Under 300 sq ft',
  'opt.300to800': '300–800 sq ft',
  'opt.over800': 'Over 800 sq ft',
  'opt.bedroomBath': 'Bedroom and/or bathroom',
  'opt.livingSpace': 'More living space',
  'opt.secondStory': 'Second storey',
  'opt.adu': 'ADU / granny flat',
  'opt.plansYes': 'Yes, plans are done',
  'opt.plansNo': 'No plans yet',
  'opt.plansHelp': 'I need help getting them',
  'opt.lotOwned': 'I own the lot',
  'opt.lotBuying': 'In escrow',
  'opt.lotLooking': 'Still looking',
  'opt.under1500': 'Under 1,500 sq ft',
  'opt.1500to2500': '1,500–2,500 sq ft',
  'opt.over2500': 'Over 2,500 sq ft',
  'opt.livingIn': 'Yes, living in it',
  'opt.vacant': 'No, it will be empty',
  'opt.oneRoom': 'One room',
  'opt.severalRooms': 'Several rooms',
  'opt.wholeHouse': 'The whole house',
  'opt.hardwood': 'Hardwood',
  'opt.vinylPlank': 'Vinyl plank',
  'opt.tileFloor': 'Tile',
  'opt.fullReplace': 'Full replacement',
  'opt.leakRepair': 'A leak to chase down',
  'opt.inspection': 'Just an inspection',
  'opt.panelUpgrade': 'Panel upgrade',
  'opt.newCircuits': 'New circuits or outlets',
  'opt.lighting': 'Lighting',
  'opt.troubleshoot': 'Something is not working',
};
