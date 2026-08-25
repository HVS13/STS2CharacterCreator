import type {
  BasicEntity,
  Card,
  Effect,
  Project,
  Relic,
  RelicHook,
  Status,
} from '../types';

export const now = () => new Date().toISOString();
export const createId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;

export function makeEffect(type: Effect['type'], amount?: number, extra: Partial<Effect> = {}): Effect {
  return { id: createId('effect'), type, ...(amount === undefined ? {} : { amount }), ...extra };
}

export function makeCard(overrides: Partial<Card> = {}): Card {
  return {
    id: createId('card'),
    name: 'New Card',
    description: '',
    type: 'attack',
    rarity: 'common',
    cost: 1,
    target: 'enemy',
    tags: [],
    effects: [makeEffect('damage', 6, { target: 'enemy' })],
    ...overrides,
  };
}

export function makeStatus(overrides: Partial<Status> = {}): Status {
  return {
    id: createId('status'),
    name: 'New Status',
    description: 'Describe what this status does.',
    emoji: '✦',
    isBuff: true,
    hook: 'damage_dealt',
    amount: 1,
    decay: 'none',
    singleStack: false,
    ...overrides,
  };
}

export function makeRelic(overrides: Partial<Relic> = {}): Relic {
  const hook: RelicHook = {
    id: createId('hook'),
    trigger: 'turn_start',
    oncePerCombat: true,
    effects: [makeEffect('block', 3, { target: 'self' })],
  };
  return {
    id: createId('relic'),
    name: 'New Relic',
    description: 'Describe when this relic helps the player.',
    tier: 'starter',
    hooks: [hook],
    ...overrides,
  };
}

const basicEntity = (name: string, description: string): BasicEntity => ({ id: createId('entity'), name, description });

export function createDefaultProject(name = 'New Character'): Project {
  const strike = makeCard({
    name: 'Spark Strike',
    description: 'A reliable first attack.',
    type: 'attack',
    rarity: 'basic',
    effects: [makeEffect('damage', 6, { target: 'enemy' })],
    upgrade: { effects: [makeEffect('damage', 12, { target: 'enemy' })] },
  });
  const guard = makeCard({
    name: 'Guard',
    description: 'Protect yourself.',
    type: 'skill',
    rarity: 'basic',
    effects: [makeEffect('block', 5, { target: 'self' })],
  });
  const status = makeStatus({
    name: 'Momentum',
    description: 'Your attacks deal bonus damage equal to its stacks.',
    emoji: '⚡',
    hook: 'damage_dealt',
    amount: 2,
  });
  const relic = makeRelic({
    name: 'Ember Charm',
    description: 'At the start of combat, gain 3 Block.',
  });
  return {
    schemaVersion: 1,
    id: createId('project'),
    name,
    description: 'A local-first STS2 character project.',
    createdAt: now(),
    updatedAt: now(),
    character: {
      name,
      description: 'A new hero with a story to tell.',
      maxHp: 70,
      maxEnergy: 3,
      startingGold: 99,
      cardPoolColor: '#3b82f6',
      startingDeck: [
        { cardId: strike.id, count: 4 },
        { cardId: guard.id, count: 1 },
      ],
      startingRelics: [relic.id],
    },
    cards: [strike, guard],
    relics: [relic],
    potions: [],
    enchantments: [],
    mechanics: {
      statuses: [status],
      stances: [],
      orbs: [],
      companions: [],
    },
    presentation: {
      artwork: [],
      dialogue: [],
      locales: { en: {} },
    },
  };
}

export function cloneProject(project: Project): Project {
  return structuredClone(project);
}

export function updateEntityName(project: Project, id: string, name: string): void {
  const collections = [project.cards, project.relics, project.potions, project.enchantments, project.mechanics.statuses, project.mechanics.stances, project.mechanics.orbs, project.mechanics.companions];
  for (const collection of collections) {
    const entity = collection.find((item) => item.id === id);
    if (entity) {
      entity.name = name;
      return;
    }
  }
}
