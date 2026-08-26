import type { Project, RuntimeStatus } from '../types';

export type RuntimeCapability =
  | 'core'
  | 'advanced_runtime'
  | 'custom_resources'
  | 'advanced_hooks'
  | 'custom_powers'
  | 'orbs'
  | 'minions'
  | 'summons'
  | 'companions'
  | 'minion_targeting'
  | 'qa_automation';

export type RuntimeLibraryId = 'base-lib' | 'ritsu-lib' | 'minion-lib' | 'kit-lib';
export type RuntimeLibraryRole = 'required' | 'optional' | 'developer-only';
export type RuntimeCompatibility = 'proven' | 'incompatible' | 'untested';
export type RuntimeMode = 'play' | 'development' | 'test';
export type RuntimeResolutionStatus = 'ready' | 'missing' | 'incompatible' | 'untested';

export interface RuntimeLibraryDescriptor {
  id: RuntimeLibraryId;
  displayName: string;
  role: RuntimeLibraryRole;
  repository: string;
  testedVersion: string;
  testedCommit: string;
  releaseCommit?: string;
  testedSts2Version: string;
  testedSts2Build: string;
  dependencies: readonly RuntimeLibraryId[];
  bundled: boolean;
  installation: {
    folder: string;
    manifest: string;
    hasDll: boolean;
    hasPck: boolean;
  };
  compatibility: RuntimeCompatibility;
  compatibilityNote: string;
  license: string;
}

export const RUNTIME_LIBRARY_REGISTRY = [
  {
    id: 'base-lib',
    displayName: 'BaseLib',
    role: 'required',
    repository: 'https://github.com/Alchyr/BaseLib-StS2',
    testedVersion: '3.4.5',
    testedCommit: '22757933ba10adc4322a628519a233a567507d87',
    testedSts2Version: '0.111.0',
    testedSts2Build: '24724944',
    dependencies: [],
    bundled: true,
    installation: { folder: 'BaseLib', manifest: 'BaseLib.json', hasDll: true, hasPck: true },
    compatibility: 'proven',
    compatibilityNote: 'Existing bundled runtime path and STS2 0.111.0 launch are proven.',
    license: 'MIT',
  },
  {
    id: 'ritsu-lib',
    displayName: 'RitsuLib',
    role: 'optional',
    repository: 'https://github.com/BAKAOLC/STS2-RitsuLib',
    testedVersion: '0.5.14',
    testedCommit: '8fca891d65de050b1848b9dc4e1fcc449dacf253',
    releaseCommit: '8fca891d65de050b1848b9dc4e1fcc449dacf253',
    testedSts2Version: '0.111.0',
    testedSts2Build: '24724944',
    dependencies: ['base-lib'],
    bundled: false,
    installation: { folder: 'STS2-RitsuLib', manifest: 'mod_manifest.json', hasDll: true, hasPck: false },
    compatibility: 'untested',
    compatibilityNote: 'The 0.111.0 compatibility DLL builds. STS2 load has not been proven.',
    license: 'MIT',
  },
  {
    id: 'minion-lib',
    displayName: 'MinionLib',
    role: 'optional',
    repository: 'https://github.com/FuYnAloft/MinionLib',
    testedVersion: '0.6.2',
    testedCommit: '817eb721843354937021a312b55edf02544d000b',
    releaseCommit: 'bdd8bcec4691b9974f5b47542f3f073b1448fd2b',
    testedSts2Version: '0.111.0',
    testedSts2Build: '24724944',
    dependencies: ['base-lib'],
    bundled: false,
    installation: { folder: 'MinionLib', manifest: 'MinionLib.json', hasDll: true, hasPck: true },
    compatibility: 'untested',
    compatibilityNote: 'Current source builds against the local game DLL. PCK export and STS2 load have not been proven.',
    license: 'LGPL-3.0-only',
  },
  {
    id: 'kit-lib',
    displayName: 'KitLib',
    role: 'developer-only',
    repository: 'https://github.com/WRXinYue/STS2-KitLib',
    testedVersion: '0.33.0',
    testedCommit: 'ab43d0bf4fd9709f4b7bcb327b6778d2e7949d95',
    releaseCommit: '9aaaa15cae03273d82ad6667f562cab473df1976',
    testedSts2Version: '0.111.0',
    testedSts2Build: '24724944',
    dependencies: [],
    bundled: false,
    installation: { folder: 'KitLib', manifest: 'mod_manifest.json', hasDll: true, hasPck: false },
    compatibility: 'untested',
    compatibilityNote: 'Core builds against the local game DLL. Developer runtime load has not been proven.',
    license: 'MIT',
  },
] as const satisfies readonly RuntimeLibraryDescriptor[];

const runtimeLibraryById = new Map<RuntimeLibraryId, RuntimeLibraryDescriptor>(RUNTIME_LIBRARY_REGISTRY.map((library) => [library.id, library as RuntimeLibraryDescriptor]));
const capabilityOrder: RuntimeCapability[] = [
  'core', 'advanced_runtime', 'custom_resources', 'advanced_hooks', 'custom_powers', 'orbs',
  'minions', 'summons', 'companions', 'minion_targeting', 'qa_automation',
];
const libraryOrder = new Map(RUNTIME_LIBRARY_REGISTRY.map((library, index) => [library.id, index]));

export const RUNTIME_CAPABILITY_DEPENDENCIES: Readonly<Record<RuntimeCapability, readonly RuntimeLibraryId[]>> = {
  core: ['base-lib'],
  advanced_runtime: ['ritsu-lib'],
  custom_resources: ['ritsu-lib'],
  advanced_hooks: ['ritsu-lib'],
  custom_powers: ['ritsu-lib'],
  orbs: ['ritsu-lib'],
  minions: ['minion-lib'],
  summons: ['minion-lib'],
  companions: ['minion-lib'],
  minion_targeting: ['minion-lib'],
  qa_automation: ['kit-lib'],
};

export interface RuntimeResolution {
  capabilities: RuntimeCapability[];
  requiredLibraryIds: RuntimeLibraryId[];
  requiredLibraries: RuntimeLibraryDescriptor[];
  missingLibraries: RuntimeLibraryId[];
  incompatibleLibraries: RuntimeLibraryId[];
  untestedLibraries: RuntimeLibraryId[];
  developerOnlyLibraries: RuntimeLibraryId[];
  status: RuntimeResolutionStatus;
  message: string;
  diagnostics: string[];
}

function sortCapabilities(capabilities: Iterable<RuntimeCapability>): RuntimeCapability[] {
  return [...new Set(capabilities)].sort((left, right) => capabilityOrder.indexOf(left) - capabilityOrder.indexOf(right));
}

function sortLibraries(libraries: Iterable<RuntimeLibraryId>): RuntimeLibraryId[] {
  return [...new Set(libraries)].sort((left, right) => (libraryOrder.get(left) ?? Number.MAX_SAFE_INTEGER) - (libraryOrder.get(right) ?? Number.MAX_SAFE_INTEGER));
}

function expandDependencies(initial: Iterable<RuntimeLibraryId>): RuntimeLibraryId[] {
  const expanded = new Set<RuntimeLibraryId>();
  const visit = (id: RuntimeLibraryId) => {
    if (expanded.has(id)) return;
    expanded.add(id);
    const library = runtimeLibraryById.get(id);
    library?.dependencies.forEach(visit);
  };
  [...initial].forEach(visit);
  return sortLibraries(expanded);
}

export function resolveRuntimeRequirements(
  capabilities: readonly RuntimeCapability[],
  options: { mode?: RuntimeMode; availableLibraryIds?: readonly RuntimeLibraryId[] } = {},
): RuntimeResolution {
  const mode = options.mode ?? 'play';
  const normalizedCapabilities = sortCapabilities(capabilities);
  const selected = new Set<RuntimeLibraryId>();
  const developerOnly = new Set<RuntimeLibraryId>();
  const diagnostics: string[] = [];

  for (const capability of normalizedCapabilities) {
    const dependencies = RUNTIME_CAPABILITY_DEPENDENCIES[capability];
    if (capability === 'qa_automation' && mode === 'play') {
      dependencies.forEach((id) => developerOnly.add(id));
      diagnostics.push('QA automation is developer-only and is excluded from normal Play.');
      continue;
    }
    dependencies.forEach((id) => selected.add(id));
  }

  const requiredLibraryIds = expandDependencies(selected);
  const available = new Set(options.availableLibraryIds ?? RUNTIME_LIBRARY_REGISTRY.filter((library) => library.bundled).map((library) => library.id));
  const requiredLibraries = requiredLibraryIds.map((id) => runtimeLibraryById.get(id)).filter((library): library is RuntimeLibraryDescriptor => Boolean(library));
  const missingLibraries = requiredLibraryIds.filter((id) => !available.has(id));
  const incompatibleLibraries = requiredLibraries.filter((library) => library.compatibility === 'incompatible').map((library) => library.id);
  const untestedLibraries = requiredLibraries.filter((library) => library.compatibility === 'untested').map((library) => library.id);
  const developerOnlyLibraries = sortLibraries([...developerOnly, ...requiredLibraries.filter((library) => library.role === 'developer-only').map((library) => library.id)]);
  const status: RuntimeResolutionStatus = incompatibleLibraries.length > 0
    ? 'incompatible'
    : missingLibraries.length > 0
      ? 'missing'
      : untestedLibraries.length > 0
        ? 'untested'
        : 'ready';
  const message = status === 'ready'
    ? 'Runtime ready'
    : status === 'untested'
      ? 'Runtime compatibility is not yet proven for this STS2 build.'
      : 'Additional runtime components required.';

  if (missingLibraries.length) diagnostics.push(`Missing runtime libraries: ${missingLibraries.join(', ')}.`);
  if (incompatibleLibraries.length) diagnostics.push(`Incompatible runtime libraries: ${incompatibleLibraries.join(', ')}.`);
  if (untestedLibraries.length) diagnostics.push(`Untested runtime libraries: ${untestedLibraries.join(', ')}.`);

  return {
    capabilities: normalizedCapabilities,
    requiredLibraryIds,
    requiredLibraries,
    missingLibraries,
    incompatibleLibraries,
    untestedLibraries,
    developerOnlyLibraries,
    status,
    message,
    diagnostics,
  };
}

export function projectRuntimeCapabilities(project: Project): RuntimeCapability[] {
  const capabilities = new Set<RuntimeCapability>(['core']);
  if (project.mechanics.companions.length > 0) capabilities.add('companions');
  if (project.mechanics.orbs.length > 0) capabilities.add('orbs');
  const effects = project.cards.flatMap((card) => [...card.effects, ...(card.upgrade?.effects ?? [])]);
  for (const effect of effects) {
    if (effect.type === 'summon') capabilities.add('summons');
    if (effect.type === 'gain_orb_slot' || effect.type === 'channel_orb') capabilities.add('orbs');
  }
  return sortCapabilities(capabilities);
}

export function runtimeAvailableLibraryIds(status: RuntimeStatus | null): RuntimeLibraryId[] {
  const available: RuntimeLibraryId[] = ['base-lib'];
  if (status?.ritsu_lib_found) available.push('ritsu-lib');
  if (status?.minion_lib_found) available.push('minion-lib');
  if (status?.kit_lib_found) available.push('kit-lib');
  return sortLibraries(available);
}
