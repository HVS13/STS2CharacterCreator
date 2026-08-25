import { z } from 'zod';

const ConditionSchema = z.object({
  type: z.string(),
  value: z.number().optional(),
  statusId: z.string().optional(),
  negate: z.boolean().optional(),
});

const EffectSchema = z.object({
  id: z.string(),
  type: z.string(),
  amount: z.number().optional(),
  target: z.string().optional(),
  statusId: z.string().optional(),
  condition: ConditionSchema.optional(),
  cards: z.string().optional(),
});

const CardSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  type: z.string(),
  rarity: z.string(),
  cost: z.number(),
  target: z.string(),
  tags: z.array(z.string()),
  effects: z.array(EffectSchema),
  upgrade: z.object({ effects: z.array(EffectSchema), cost: z.number().optional() }).optional(),
  artworkAssetId: z.string().optional(),
});

const StatusSchema = z.object({
  id: z.string(), name: z.string(), description: z.string(), emoji: z.string(),
  isBuff: z.boolean(), hook: z.string(), amount: z.number(), decay: z.string(), singleStack: z.boolean(),
});

const RelicSchema = z.object({
  id: z.string(), name: z.string(), description: z.string(), tier: z.string(),
  hooks: z.array(z.object({ id: z.string(), trigger: z.string(), oncePerCombat: z.boolean(), effects: z.array(EffectSchema) })),
});

export const ProjectSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string(),
  name: z.string(),
  description: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  character: z.object({
    name: z.string(), description: z.string(), maxHp: z.number(), maxEnergy: z.number(), startingGold: z.number(),
    cardPoolColor: z.string(), startingDeck: z.array(z.object({ cardId: z.string(), count: z.number() })),
    startingRelics: z.array(z.string()), artworkAssetId: z.string().optional(),
  }),
  cards: z.array(CardSchema),
  relics: z.array(RelicSchema),
  potions: z.array(z.object({ id: z.string(), name: z.string(), description: z.string(), rarity: z.string() })),
  enchantments: z.array(z.object({ id: z.string(), name: z.string(), description: z.string(), effectText: z.string() })),
  mechanics: z.object({
    statuses: z.array(StatusSchema),
    stances: z.array(z.object({ id: z.string(), name: z.string(), description: z.string() })),
    orbs: z.array(z.object({ id: z.string(), name: z.string(), description: z.string() })),
    companions: z.array(z.object({ id: z.string(), name: z.string(), description: z.string() })),
  }),
  presentation: z.object({
    artwork: z.array(z.object({ id: z.string(), name: z.string(), relativePath: z.string(), kind: z.string(), mimeType: z.string() })),
    dialogue: z.array(z.object({ id: z.string(), key: z.string(), text: z.string() })),
    locales: z.record(z.string(), z.record(z.string(), z.string())),
  }),
});
