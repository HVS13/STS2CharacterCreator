import type { Card, Condition, Effect, Project, RuntimeBundle } from '../types';

function conditionToBlank(condition: Condition | undefined, project: Project): Record<string, unknown> | undefined {
  if (!condition) return undefined;
  const result: Record<string, unknown> = { kind: condition.type };
  if (condition.value !== undefined) result.value = condition.value;
  if (condition.negate) result.negate = true;
  if (condition.statusId) {
    result.status = project.mechanics.statuses.find((status) => status.id === condition.statusId)?.name ?? condition.statusId;
  }
  return result;
}

function effectToBlank(effect: Effect, project: Project): Record<string, unknown> {
  const result: Record<string, unknown> = { op: effect.type };
  if (effect.amount !== undefined) result.amount = effect.amount;
  if (effect.target) result.target = effect.target;
  if (effect.cards) result.cards = effect.cards;
  if (effect.statusId) {
    const status = project.mechanics.statuses.find((item) => item.id === effect.statusId);
    result.status_name = status?.name ?? effect.statusId;
  }
  const when = conditionToBlank(effect.condition, project);
  if (when) result.when = when;
  return result;
}

function cardToBlank(card: Card, project: Project): Record<string, unknown> {
  const result: Record<string, unknown> = {
    id: card.id,
    name: card.name,
    cost: card.cost,
    type: card.type,
    rarity: card.rarity,
    target: card.target,
    effects: card.effects.map((effect) => effectToBlank(effect, project)),
  };
  if (card.description) result.description = card.description;
  if (card.tags.length) result.tags = card.tags;
  if (card.upgrade) {
    result.upgrade = { effects: card.upgrade.effects.map((effect) => effectToBlank(effect, project)) };
    if (card.upgrade.cost !== undefined) result.upgraded_cost = card.upgrade.cost;
  }
  const asset = card.artworkAssetId ? project.presentation.artwork.find((item) => item.id === card.artworkAssetId) : undefined;
  if (asset) result.art_path = asset.relativePath;
  return result;
}

export function buildRuntimeBundle(project: Project): RuntimeBundle {
  const warnings: string[] = [];
  if (project.cards.length > 40) warnings.push('Only the first 40 cards fit the initial runtime capacity.');
  if (project.mechanics.statuses.length > 4) warnings.push('Only the first 4 statuses fit the initial runtime capacity.');
  if (project.relics.length > 1) warnings.push('Only one starter relic is supported by the initial runtime backend.');
  const cards = project.cards.slice(0, 40).map((card) => cardToBlank(card, project));
  const character: Record<string, unknown> = {
    name: project.character.name,
    description: project.character.description,
    max_hp: project.character.maxHp,
    max_energy: project.character.maxEnergy,
    starting_deck: project.character.startingDeck.map((entry) => ({ slot: Math.max(1, project.cards.findIndex((card) => card.id === entry.cardId) + 1), count: entry.count })),
    status_pool: project.mechanics.statuses.slice(0, 4).map((status) => ({
      name: status.name,
      emoji: status.emoji,
      description: status.description,
      buff: status.isBuff,
      hook: status.hook,
      amount: status.amount,
      decay: status.decay,
      single_stack: status.singleStack,
      mode: 'additive',
    })),
  };
  const starterRelic = project.relics[0];
  let relic: Record<string, unknown> | undefined;
  if (starterRelic) {
    relic = {
      id: starterRelic.id,
      name: starterRelic.name,
      description: starterRelic.description,
      tier: starterRelic.tier,
      hooks: starterRelic.hooks.map((hook) => ({
        trigger: hook.trigger,
        once_per_combat: hook.oncePerCombat,
        effects: hook.effects.map((effect) => effectToBlank(effect, project)),
      })),
    };
    character.relic = relic;
  }
  const files: Record<string, string> = {
    'characters/01.json': JSON.stringify(character, null, 2),
  };
  cards.forEach((card, index) => {
    files[`characters/01/cards/${String(index + 1).padStart(2, '0')}.json`] = JSON.stringify(card, null, 2);
  });
  return { character, cards, relic, files, warnings };
}

export function effectLabel(effect: Effect, project: Project): string {
  const amount = effect.amount ?? 0;
  const target = effect.target === 'self' ? 'yourself' : effect.target === 'allEnemies' ? 'all enemies' : effect.target === 'enemy' ? 'the selected enemy' : '';
  const status = effect.statusId ? project.mechanics.statuses.find((item) => item.id === effect.statusId)?.name ?? 'a status' : 'a status';
  switch (effect.type) {
    case 'damage': return `Deal ${amount} damage${target ? ` to ${target}` : ''}`;
    case 'block': return `Gain ${amount} Block`;
    case 'draw': return `Draw ${amount} card${amount === 1 ? '' : 's'}`;
    case 'gain_energy': return `Gain ${amount} Energy`;
    case 'heal': return `Heal ${amount} HP`;
    case 'lose_hp': return `Lose ${amount} HP`;
    case 'apply_status':
    case 'apply_custom_status': return `Apply ${status} ${amount > 0 ? `(${amount})` : ''}`.trim();
    case 'upgrade_card': return `Upgrade ${effect.cards === 'all' ? 'all cards' : 'a card'}`;
    case 'retain': return 'Retain this card';
    case 'innate': return 'Start each combat with this card in your hand';
    case 'exhaust': return 'Exhaust this card';
    case 'ethereal': return 'Exhaust if this card is still in hand at the end of turn';
    case 'scry': return `Scry ${amount}`;
    case 'gain_orb_slot': return `Gain ${amount} Orb Slot${amount === 1 ? '' : 's'}`;
    case 'channel_orb': return 'Channel an Orb';
    case 'summon': return 'Summon a companion';
    default: return 'Apply an effect';
  }
}

export function conditionLabel(condition: Condition | undefined, project: Project): string | null {
  if (!condition) return null;
  const value = condition.value ?? 0;
  switch (condition.type) {
    case 'turn_at_least': return `If turn is at least ${value}`;
    case 'target_has_status': return `If target has ${project.mechanics.statuses.find((status) => status.id === condition.statusId)?.name ?? 'this status'}`;
    case 'has_block': return 'If you have Block';
    case 'no_block': return 'If the target has no Block';
    case 'hp_below_half': return 'If the target is below half HP';
    case 'hand_size_ge': return `If your hand has at least ${value} cards`;
    case 'draw_pile_empty': return 'If your draw pile is empty';
    default: return 'If this condition is true';
  }
}

export function cardDescription(card: Card, project: Project, upgraded = false): string {
  const effects = upgraded && card.upgrade ? card.upgrade.effects : card.effects;
  return effects.map((effect) => {
    const text = effectLabel(effect, project);
    const condition = conditionLabel(effect.condition, project);
    return condition ? `${condition}, ${text.toLocaleLowerCase()}` : text;
  }).join('. ') + (effects.length ? '.' : '');
}
