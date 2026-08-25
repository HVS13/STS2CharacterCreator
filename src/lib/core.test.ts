import { describe, expect, it } from 'vitest';
import { createDefaultProject, makeCard, makeEffect } from './model';
import { buildRuntimeBundle, cardDescription } from './runtimeAdapter';
import { validateProject } from './validation';

describe('canonical project model', () => {
  it('creates a valid starter project and runtime bundle', () => {
    const project = createDefaultProject();
    expect(validateProject(project).filter((issue) => issue.severity === 'error')).toHaveLength(0);
    const bundle = buildRuntimeBundle(project);
    expect(bundle.files['characters/01.json']).toBeTruthy();
    expect(bundle.files['characters/01/cards/01.json']).toContain('Spark Strike');
    expect(cardDescription(project.cards[0], project)).toContain('Deal 6 damage');
  });

  it('maps proven character, card, upgrade, condition, status, and relic fields', () => {
    const project = createDefaultProject();
    const card = project.cards[0];
    card.effects[0].amount = 11;
    card.effects[0].condition = { type: 'turn_at_least', value: 2 };
    if (!card.upgrade) throw new Error('starter card should have an upgrade');
    card.upgrade.effects[0].amount = 15;

    const bundle = buildRuntimeBundle(project);
    const character = bundle.character as { name: unknown; status_pool: Array<Record<string, unknown>>; relic?: Record<string, unknown> };
    const runtimeCard = JSON.parse(bundle.files['characters/01/cards/01.json']) as Record<string, any>;

    expect(character.name).toBe(project.character.name);
    expect(character.status_pool[0]).toMatchObject({ name: project.mechanics.statuses[0].name, hook: 'damage_dealt' });
    expect(character.relic).toMatchObject({ name: project.relics[0].name });
    expect(runtimeCard).toMatchObject({
      cost: 1,
      effects: [{ op: 'damage', amount: 11, target: 'enemy', when: { kind: 'turn_at_least', value: 2 } }],
      upgrade: { effects: [{ op: 'damage', amount: 15, target: 'enemy' }] },
    });
    expect(bundle.warnings).toEqual([]);
  });
  it('reports broken card references and negative values', () => {
    const project = createDefaultProject();
    const card = makeCard({
      name: 'Broken Card',
      effects: [makeEffect('damage', -2, { target: 'enemy', statusId: 'missing-status' })],
    });
    project.cards.push(card);
    const messages = validateProject(project).map((issue) => issue.message);
    expect(messages.some((message) => message.includes('negative numeric effect'))).toBe(true);
    expect(messages.some((message) => message.includes('references a status'))).toBe(true);
  });
});