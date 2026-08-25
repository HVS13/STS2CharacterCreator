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