export type CardType = 'attack' | 'skill' | 'power';
export type CardRarity = 'basic' | 'common' | 'uncommon' | 'rare' | 'token';
export type CardTarget = 'self' | 'enemy' | 'allEnemies' | 'none';
export type EffectType =
  | 'damage'
  | 'block'
  | 'draw'
  | 'gain_energy'
  | 'heal'
  | 'lose_hp'
  | 'apply_status'
  | 'apply_custom_status'
  | 'upgrade_card'
  | 'retain'
  | 'innate'
  | 'exhaust'
  | 'ethereal'
  | 'scry'
  | 'gain_orb_slot'
  | 'channel_orb'
  | 'summon';
export type ConditionType =
  | 'turn_at_least'
  | 'target_has_status'
  | 'has_block'
  | 'no_block'
  | 'hp_below_half'
  | 'hand_size_ge'
  | 'draw_pile_empty';
export type StatusHook = 'damage_dealt' | 'damage_taken' | 'block_gained' | 'energy_gain' | 'card_draw';
export type DecayMode = 'none' | 'lose_one_eot' | 'lose_all_eot';
export type SectionId =
  | 'character'
  | 'cards'
  | 'relics'
  | 'potions'
  | 'enchantments'
  | 'statuses'
  | 'stances'
  | 'orbs'
  | 'companions'
  | 'artwork'
  | 'lore'
  | 'localization'
  | 'settings';

export interface Condition {
  type: ConditionType;
  value?: number;
  statusId?: string;
  negate?: boolean;
}

export interface Effect {
  id: string;
  type: EffectType;
  amount?: number;
  target?: CardTarget;
  statusId?: string;
  condition?: Condition;
  cards?: 'all' | 'hand' | 'discard' | 'draw';
}

export interface CardUpgrade {
  effects: Effect[];
  cost?: number;
}

export interface Card {
  id: string;
  name: string;
  description?: string;
  type: CardType;
  rarity: CardRarity;
  cost: number;
  target: CardTarget;
  tags: string[];
  effects: Effect[];
  upgrade?: CardUpgrade;
  artworkAssetId?: string;
}

export interface Status {
  id: string;
  name: string;
  description: string;
  emoji: string;
  isBuff: boolean;
  hook: StatusHook;
  amount: number;
  decay: DecayMode;
  singleStack: boolean;
}

export interface RelicHook {
  id: string;
  trigger: 'turn_start' | 'turn_end' | 'attacked' | 'on_card_played' | 'combat_end' | 'on_damage_dealt' | 'on_block_gained' | 'on_hp_lost';
  oncePerCombat: boolean;
  effects: Effect[];
}

export interface Relic {
  id: string;
  name: string;
  description: string;
  tier: 'starter' | 'common' | 'uncommon' | 'rare' | 'boss' | 'shop';
  hooks: RelicHook[];
}

export interface Potion extends BasicEntity {
  rarity: 'common' | 'uncommon' | 'rare';
}

export interface Enchantment extends BasicEntity {
  effectText: string;
}

export interface BasicEntity {
  id: string;
  name: string;
  description: string;
}

export interface Character {
  name: string;
  description: string;
  maxHp: number;
  maxEnergy: number;
  startingGold: number;
  cardPoolColor: string;
  startingDeck: Array<{ cardId: string; count: number }>;
  startingRelics: string[];
  artworkAssetId?: string;
}

export interface ArtworkAsset {
  id: string;
  name: string;
  relativePath: string;
  kind: 'card' | 'character' | 'relic' | 'status' | 'other';
  mimeType: 'image/png' | 'image/jpeg';
}

export interface DialogueEntry {
  id: string;
  key: string;
  text: string;
}

export interface Project {
  schemaVersion: 1;
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  character: Character;
  cards: Card[];
  relics: Relic[];
  potions: Potion[];
  enchantments: Enchantment[];
  mechanics: {
    statuses: Status[];
    stances: BasicEntity[];
    orbs: BasicEntity[];
    companions: BasicEntity[];
  };
  presentation: {
    artwork: ArtworkAsset[];
    dialogue: DialogueEntry[];
    locales: Record<string, Record<string, string>>;
  };
}

export interface ValidationIssue {
  id: string;
  severity: 'error' | 'warning';
  message: string;
  entityId?: string;
  section?: SectionId;
}

export interface RuntimeStatus {
  game_found: boolean;
  game_path: string | null;
  mods_path: string | null;
  base_lib_found: boolean;
  blank_found: boolean;
  game_version: string | null;
  message: string;
}

export interface RuntimeBundle {
  character: Record<string, unknown>;
  cards: Record<string, unknown>[];
  relic?: Record<string, unknown>;
  files: Record<string, string>;
  warnings: string[];
}
