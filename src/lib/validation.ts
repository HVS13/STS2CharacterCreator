import type { Project, SectionId, ValidationIssue } from '../types';
import { ProjectSchema } from './schema';

const issue = (severity: ValidationIssue['severity'], message: string, entityId?: string, section?: SectionId): ValidationIssue => ({
  id: `${severity}-${entityId ?? 'project'}-${message}`,
  severity,
  message,
  entityId,
  section,
});

function duplicates(values: string[]): string[] {
  const seen = new Set<string>();
  const result = new Set<string>();
  for (const value of values) {
    const normalized = value.trim().toLocaleLowerCase();
    if (seen.has(normalized)) result.add(value);
    seen.add(normalized);
  }
  return [...result];
}

export function validateProject(project: Project): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const parsed = ProjectSchema.safeParse(project);
  if (!parsed.success) {
    issues.push(issue('error', 'Some project data is not in a valid format. Open the affected section and repair the highlighted fields.', undefined, 'settings'));
  }
  if (!project.name.trim()) issues.push(issue('error', 'Give the project a name before saving.', project.id, 'settings'));
  if (!project.character.name.trim()) issues.push(issue('error', 'Give the character a name.', undefined, 'character'));
  if (project.character.maxHp < 1 || project.character.maxHp > 999) issues.push(issue('error', 'Max HP must be between 1 and 999.', undefined, 'character'));
  if (project.character.maxEnergy < 1 || project.character.maxEnergy > 10) issues.push(issue('error', 'Energy must be between 1 and 10.', undefined, 'character'));
  if (project.cards.length > 40) issues.push(issue('warning', 'This project has more than the proven runtime card capacity of 40.', undefined, 'cards'));
  if (project.mechanics.statuses.length > 4) issues.push(issue('warning', 'This project has more than the proven runtime status capacity of 4.', undefined, 'statuses'));
  if (project.relics.length > 1) issues.push(issue('warning', 'The initial runtime backend supports one starter relic per character.', undefined, 'relics'));

  const entityCollections = [
    { items: project.cards, label: 'card', section: 'cards' as SectionId },
    { items: project.relics, label: 'relic', section: 'relics' as SectionId },
    { items: project.mechanics.statuses, label: 'status', section: 'statuses' as SectionId },
  ];
  for (const collection of entityCollections) {
    for (const name of duplicates(collection.items.map((item) => item.name))) {
      issues.push(issue('error', `The ${collection.label} name "${name}" is duplicated. Rename one so references stay clear.`, undefined, collection.section));
    }
    for (const item of collection.items) {
      if (!item.name.trim()) issues.push(issue('error', `A ${collection.label} is missing its name.`, item.id, collection.section));
    }
  }

  const cardIds = new Set(project.cards.map((card) => card.id));
  const statusIds = new Set(project.mechanics.statuses.map((status) => status.id));
  const relicIds = new Set(project.relics.map((relic) => relic.id));
  for (const entry of project.character.startingDeck) {
    if (!cardIds.has(entry.cardId)) issues.push(issue('error', 'The starting deck references a card that no longer exists. Choose another card.', entry.cardId, 'character'));
    if (entry.count < 1 || entry.count > 99) issues.push(issue('error', 'Starting deck counts must be between 1 and 99.', entry.cardId, 'character'));
  }
  for (const relicId of project.character.startingRelics) {
    if (!relicIds.has(relicId)) issues.push(issue('error', 'The starting relic list references a relic that no longer exists.', relicId, 'character'));
  }
  for (const card of project.cards) {
    if (card.cost < 0 || card.cost > 9) issues.push(issue('error', `${card.name} cost must be between 0 and 9.`, card.id, 'cards'));
    if (card.effects.length === 0) issues.push(issue('error', `${card.name} needs at least one effect. Add an effect row.`, card.id, 'cards'));
    if (card.upgrade && card.upgrade.effects.length !== card.effects.length) issues.push(issue('error', `${card.name} has a different number of upgraded effect rows. Keep base and upgraded rows aligned.`, card.id, 'cards'));
    for (const effect of [...card.effects, ...(card.upgrade?.effects ?? [])]) {
      if (['damage', 'block', 'draw', 'gain_energy', 'heal', 'lose_hp'].includes(effect.type) && (effect.amount ?? 0) < 0) issues.push(issue('error', `${card.name} has a negative numeric effect. Use a positive amount.`, card.id, 'cards'));
      if (effect.statusId && !statusIds.has(effect.statusId)) issues.push(issue('error', `${card.name} references a status that no longer exists. Choose another status.`, card.id, 'cards'));
    }
  }
  for (const asset of project.presentation.artwork) {
    if (!asset.relativePath) issues.push(issue('error', `${asset.name} has no stored artwork path. Replace the image.`, asset.id, 'artwork'));
  }
  return issues;
}
