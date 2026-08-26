import { z } from 'zod';

const CardTypeSchema = z.enum(['attack', 'skill', 'power']);
const CardRaritySchema = z.enum(['basic', 'common', 'uncommon', 'rare', 'token']);
const CardTargetSchema = z.enum(['self', 'enemy', 'allEnemies', 'none']);
const EffectTypeSchema = z.enum([
  'damage', 'block', 'draw', 'gain_energy', 'heal', 'lose_hp', 'apply_status',
  'apply_custom_status', 'upgrade_card', 'retain', 'innate', 'exhaust', 'ethereal',
  'scry', 'gain_orb_slot', 'channel_orb', 'summon',
]);
const ConditionTypeSchema = z.enum([
  'turn_at_least', 'target_has_status', 'has_block', 'no_block', 'hp_below_half',
  'hand_size_ge', 'draw_pile_empty',
]);
const StatusHookSchema = z.enum(['damage_dealt', 'damage_taken', 'block_gained', 'energy_gain', 'card_draw']);
const DecayModeSchema = z.enum(['none', 'lose_one_eot', 'lose_all_eot']);
const RelicTierSchema = z.enum(['starter', 'common', 'uncommon', 'rare', 'boss', 'shop']);
const RelicTriggerSchema = z.enum(['turn_start', 'turn_end', 'attacked', 'on_card_played', 'combat_end', 'on_damage_dealt', 'on_block_gained', 'on_hp_lost']);
const AssetKindSchema = z.enum(['card', 'character', 'relic', 'status', 'other']);
const AssetMimeSchema = z.enum(['image/png', 'image/jpeg']);

const ConditionSchema = z.strictObject({
  type: ConditionTypeSchema,
  value: z.number().optional(),
  statusId: z.string().optional(),
  negate: z.boolean().optional(),
});

const EffectSchema = z.strictObject({
  id: z.string(),
  type: EffectTypeSchema,
  amount: z.number().optional(),
  target: CardTargetSchema.optional(),
  statusId: z.string().optional(),
  condition: ConditionSchema.optional(),
  cards: z.enum(['all', 'hand', 'discard', 'draw']).optional(),
});

const CardSchema = z.strictObject({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  type: CardTypeSchema,
  rarity: CardRaritySchema,
  cost: z.number(),
  target: CardTargetSchema,
  tags: z.array(z.string()),
  effects: z.array(EffectSchema),
  upgrade: z.strictObject({ effects: z.array(EffectSchema), cost: z.number().optional() }).optional(),
  artworkAssetId: z.string().optional(),
});

const StatusSchema = z.strictObject({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  emoji: z.string(),
  isBuff: z.boolean(),
  hook: StatusHookSchema,
  amount: z.number(),
  decay: DecayModeSchema,
  singleStack: z.boolean(),
});

const RelicSchema = z.strictObject({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  tier: RelicTierSchema,
  hooks: z.array(z.strictObject({
    id: z.string(),
    trigger: RelicTriggerSchema,
    oncePerCombat: z.boolean(),
    effects: z.array(EffectSchema),
  })),
});

const BasicEntitySchema = z.strictObject({
  id: z.string(),
  name: z.string(),
  description: z.string(),
});

export const ProjectSchema = z.strictObject({
  schemaVersion: z.literal(1),
  id: z.string(),
  name: z.string(),
  description: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  character: z.strictObject({
    name: z.string(),
    description: z.string(),
    maxHp: z.number(),
    maxEnergy: z.number(),
    startingGold: z.number(),
    cardPoolColor: z.string(),
    startingDeck: z.array(z.strictObject({ cardId: z.string(), count: z.number() })),
    startingRelics: z.array(z.string()),
    artworkAssetId: z.string().optional(),
  }),
  cards: z.array(CardSchema),
  relics: z.array(RelicSchema),
  potions: z.array(z.strictObject({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    rarity: z.enum(['common', 'uncommon', 'rare']),
  })),
  enchantments: z.array(z.strictObject({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    effectText: z.string(),
  })),
  mechanics: z.strictObject({
    statuses: z.array(StatusSchema),
    stances: z.array(BasicEntitySchema),
    orbs: z.array(BasicEntitySchema),
    companions: z.array(BasicEntitySchema),
  }),
  presentation: z.strictObject({
    artwork: z.array(z.strictObject({
      id: z.string(),
      name: z.string(),
      relativePath: z.string(),
      kind: AssetKindSchema,
      mimeType: AssetMimeSchema,
    })),
    dialogue: z.array(z.strictObject({ id: z.string(), key: z.string(), text: z.string() })),
    locales: z.record(z.string(), z.record(z.string(), z.string())),
  }),
});
