import { describe, expect, it } from 'vitest';
import { createDefaultProject } from './model';
import {
  projectRuntimeCapabilities,
  resolveRuntimeRequirements,
  RUNTIME_LIBRARY_REGISTRY,
} from './runtimeLibraries';

describe('runtime library resolver', () => {
  it('keeps the current project on the bundled BaseLib path', () => {
    const resolution = resolveRuntimeRequirements(['core']);

    expect(resolution.requiredLibraryIds).toEqual(['base-lib']);
    expect(resolution.status).toBe('ready');
    expect(resolution.missingLibraries).toEqual([]);
  });

  it('resolves advanced and minion capabilities transitively and deterministically', () => {
    const resolution = resolveRuntimeRequirements(['minions', 'advanced_hooks']);

    expect(resolution.requiredLibraryIds).toEqual(['base-lib', 'ritsu-lib', 'minion-lib']);
    expect(resolution.missingLibraries).toEqual(['ritsu-lib', 'minion-lib']);
    expect(resolution.developerOnlyLibraries).toEqual([]);
    expect(resolution.status).toBe('missing');
  });

  it('keeps KitLib developer-only and out of normal Play', () => {
    const play = resolveRuntimeRequirements(['core', 'qa_automation'], { mode: 'play' });
    const development = resolveRuntimeRequirements(['qa_automation'], {
      mode: 'development',
      availableLibraryIds: ['kit-lib'],
    });

    expect(play.requiredLibraryIds).toEqual(['base-lib']);
    expect(play.developerOnlyLibraries).toEqual(['kit-lib']);
    expect(development.requiredLibraryIds).toEqual(['kit-lib']);
    expect(development.developerOnlyLibraries).toEqual(['kit-lib']);
    expect(development.status).toBe('untested');
  });

  it('derives only internal capabilities from canonical gameplay concepts', () => {
    const project = createDefaultProject();
    expect(projectRuntimeCapabilities(project)).toEqual(['core']);

    project.mechanics.companions.push({ id: 'companion.test', name: 'Test Companion', description: '' });
    project.cards[0].effects.push({ id: 'effect.orb', type: 'channel_orb', amount: 1 });

    expect(projectRuntimeCapabilities(project)).toEqual(['core', 'orbs', 'companions']);
  });

  it('keeps registry metadata centralized', () => {
    expect(RUNTIME_LIBRARY_REGISTRY.map((library) => library.id)).toEqual([
      'base-lib', 'ritsu-lib', 'minion-lib', 'kit-lib',
    ]);
    expect(RUNTIME_LIBRARY_REGISTRY.find((library) => library.id === 'base-lib')?.bundled).toBe(true);
    expect(RUNTIME_LIBRARY_REGISTRY.find((library) => library.id === 'kit-lib')?.role).toBe('developer-only');
  });
});
