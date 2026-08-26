import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateRawSync } from 'node:zlib';
import type { Project } from '../src/types';
import { buildRuntimeBundle } from '../src/lib/runtimeAdapter';
import { ProjectSchema } from '../src/lib/schema';
import { validateProject } from '../src/lib/validation';

export type DiagnosticLevel = 'ERROR' | 'WARN';

export interface Diagnostic {
  level: DiagnosticLevel;
  path: string;
  message: string;
}

export interface Inspection {
  project?: Project;
  diagnostics: Diagnostic[];
  runtimeWarnings: string[];
}

export class ToolError extends Error {
  constructor(message: string, readonly diagnostics: Diagnostic[] = []) {
    super(message);
    this.name = 'ToolError';
  }
}

const idPattern = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const localePattern = /^[a-z]{2,3}(?:-[A-Z]{2})?$/;
const supportedRuntimeSections = new Set(['cards', 'mechanics.statuses', 'relics']);

function diagnostic(level: DiagnosticLevel, fieldPath: string, message: string): Diagnostic {
  return { level, path: fieldPath, message };
}

function addDiagnostic(list: Diagnostic[], level: DiagnosticLevel, fieldPath: string, message: string): void {
  list.push(diagnostic(level, fieldPath, message));
}

function relativeFieldPath(zodPath: PropertyKey[]): string {
  return zodPath.length ? `project.json.${zodPath.map(String).join('.')}` : 'project.json';
}

function idEntries(project: Project): Array<[string, string]> {
  const entries: Array<[string, string]> = [['project.id', project.id]];
  project.cards.forEach((card, cardIndex) => {
    entries.push([`cards[${cardIndex}].id`, card.id]);
    card.effects.forEach((effect, effectIndex) => entries.push([`cards[${cardIndex}].effects[${effectIndex}].id`, effect.id]));
    card.upgrade?.effects.forEach((effect, effectIndex) => entries.push([`cards[${cardIndex}].upgrade.effects[${effectIndex}].id`, effect.id]));
  });
  project.relics.forEach((relic, relicIndex) => {
    entries.push([`relics[${relicIndex}].id`, relic.id]);
    relic.hooks.forEach((hook, hookIndex) => {
      entries.push([`relics[${relicIndex}].hooks[${hookIndex}].id`, hook.id]);
      hook.effects.forEach((effect, effectIndex) => entries.push([`relics[${relicIndex}].hooks[${hookIndex}].effects[${effectIndex}].id`, effect.id]));
    });
  });
  project.mechanics.statuses.forEach((status, index) => entries.push([`mechanics.statuses[${index}].id`, status.id]));
  for (const [section, items] of Object.entries({
    stances: project.mechanics.stances,
    orbs: project.mechanics.orbs,
    companions: project.mechanics.companions,
    potions: project.potions,
    enchantments: project.enchantments,
  })) {
    items.forEach((item, index) => entries.push([`${section}[${index}].id`, item.id]));
  }
  project.presentation.artwork.forEach((asset, index) => entries.push([`presentation.artwork[${index}].id`, asset.id]));
  project.presentation.dialogue.forEach((entry, index) => entries.push([`presentation.dialogue[${index}].id`, entry.id]));
  return entries;
}

function addZodDiagnostics(list: Diagnostic[], issues: Array<{ path: PropertyKey[]; message: string }>): void {
  for (const issue of issues) addDiagnostic(list, 'ERROR', relativeFieldPath(issue.path), issue.message);
}

async function addSemanticDiagnostics(root: string, project: Project, list: Diagnostic[]): Promise<void> {
  const seen = new Map<string, string>();
  for (const [fieldPath, value] of idEntries(project)) {
    if (!value || !idPattern.test(value)) {
      addDiagnostic(list, 'ERROR', fieldPath, 'ID must be non-empty and use only ASCII letters, digits, dot, underscore, or hyphen.');
    }
    const previous = seen.get(value);
    if (previous) addDiagnostic(list, 'ERROR', fieldPath, `Duplicate ID. Already used at ${previous}.`);
    else seen.set(value, fieldPath);
  }

  const cardIds = new Set(project.cards.map((card) => card.id));
  const statusIds = new Set(project.mechanics.statuses.map((status) => status.id));
  const relicIds = new Set(project.relics.map((relic) => relic.id));
  for (const [index, entry] of project.character.startingDeck.entries()) {
    if (!cardIds.has(entry.cardId)) addDiagnostic(list, 'ERROR', `character.startingDeck[${index}].cardId`, `Missing card reference: ${entry.cardId}`);
  }
  for (const [index, relicId] of project.character.startingRelics.entries()) {
    if (!relicIds.has(relicId)) addDiagnostic(list, 'ERROR', `character.startingRelics[${index}]`, `Missing relic reference: ${relicId}`);
  }

  const checkEffect = (effect: Project['cards'][number]['effects'][number], fieldPath: string): void => {
    if (effect.statusId && !statusIds.has(effect.statusId)) addDiagnostic(list, 'ERROR', `${fieldPath}.statusId`, `Missing status reference: ${effect.statusId}`);
    if (effect.condition?.statusId && !statusIds.has(effect.condition.statusId)) addDiagnostic(list, 'ERROR', `${fieldPath}.condition.statusId`, `Missing status reference: ${effect.condition.statusId}`);
  };
  project.cards.forEach((card, cardIndex) => {
    card.effects.forEach((effect, effectIndex) => checkEffect(effect, `cards[${cardIndex}].effects[${effectIndex}]`));
    card.upgrade?.effects.forEach((effect, effectIndex) => checkEffect(effect, `cards[${cardIndex}].upgrade.effects[${effectIndex}]`));
  });
  project.relics.forEach((relic, relicIndex) => relic.hooks.forEach((hook, hookIndex) => hook.effects.forEach((effect, effectIndex) => checkEffect(effect, `relics[${relicIndex}].hooks[${hookIndex}].effects[${effectIndex}]`))));

  const artworkIds = new Set(project.presentation.artwork.map((asset) => asset.id));
  const checkArtworkRef = (assetId: string | undefined, fieldPath: string): void => {
    if (assetId && !artworkIds.has(assetId)) addDiagnostic(list, 'ERROR', fieldPath, `Missing artwork reference: ${assetId}`);
  };
  checkArtworkRef(project.character.artworkAssetId, 'character.artworkAssetId');
  project.cards.forEach((card, index) => checkArtworkRef(card.artworkAssetId, `cards[${index}].artworkAssetId`));

  for (const [index, asset] of project.presentation.artwork.entries()) {
    const fieldPath = `presentation.artwork[${index}].relativePath`;
    const relativePath = asset.relativePath;
    if (path.isAbsolute(relativePath) || relativePath.includes('\\')) {
      addDiagnostic(list, 'ERROR', fieldPath, 'Artwork path must be a project-relative path using forward slashes.');
      continue;
    }
    const parts = relativePath.split('/');
    if (!relativePath || parts.some((part) => !part || part === '.' || part === '..')) {
      addDiagnostic(list, 'ERROR', fieldPath, 'Artwork path must be a non-empty project-relative path without . or .. segments.');
      continue;
    }
    const absolutePath = path.resolve(root, ...parts);
    const rootWithSeparator = `${path.resolve(root)}${path.sep}`;
    if (absolutePath !== path.resolve(root) && !absolutePath.startsWith(rootWithSeparator)) {
      addDiagnostic(list, 'ERROR', fieldPath, 'Artwork path must stay inside the project folder.');
      continue;
    }
    try {
      const stat = await fs.stat(absolutePath);
      if (!stat.isFile()) addDiagnostic(list, 'ERROR', fieldPath, 'Artwork path does not point to a file.');
    } catch {
      addDiagnostic(list, 'ERROR', fieldPath, `Artwork file not found: ${relativePath}`);
    }
    const expectedExtension = asset.mimeType === 'image/png' ? '.png' : '.jpg';
    if (path.extname(relativePath).toLocaleLowerCase() !== expectedExtension && !(asset.mimeType === 'image/jpeg' && path.extname(relativePath).toLocaleLowerCase() === '.jpeg')) {
      addDiagnostic(list, 'ERROR', fieldPath, `Artwork extension must match ${asset.mimeType}.`);
    }
  }

  for (const locale of Object.keys(project.presentation.locales)) {
    if (!localePattern.test(locale)) addDiagnostic(list, 'ERROR', `presentation.locales.${locale}`, 'Locale code must look like en or en-US.');
  }
  try {
    await fs.stat(path.join(root, 'project.json'));
  } catch {
    addDiagnostic(list, 'ERROR', 'project.json', 'The canonical project file is missing.');
  }
  try {
    const manifest = await fs.readFile(path.join(root, 'manifest.json'), 'utf8');
    JSON.parse(manifest);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') addDiagnostic(list, 'ERROR', 'manifest.json', 'manifest.json must contain valid JSON.');
  }

  const runtime = buildRuntimeBundle(project);
  for (const warning of runtime.warnings) addDiagnostic(list, 'WARN', 'runtime', warning);
  if (project.potions.length || project.enchantments.length || project.mechanics.stances.length || project.mechanics.orbs.length || project.mechanics.companions.length) {
    addDiagnostic(list, 'WARN', 'runtime', 'Some canonical editor data is preserved but not emitted by the current BLANK runtime adapter.');
  }
  if (project.character.artworkAssetId) addDiagnostic(list, 'WARN', 'character.artworkAssetId', 'Character artwork is preserved but current BLANK runtime proof covers card artwork only.');
}

export async function inspectProjectFolder(folderPath: string): Promise<Inspection> {
  const root = path.resolve(folderPath);
  const diagnostics: Diagnostic[] = [];
  try {
    const stat = await fs.stat(root);
    if (!stat.isDirectory()) throw new Error('not a directory');
  } catch {
    addDiagnostic(diagnostics, 'ERROR', 'project', `Project folder not found: ${folderPath}`);
    return { diagnostics, runtimeWarnings: [] };
  }
  let raw: unknown;
  try {
    raw = JSON.parse(await fs.readFile(path.join(root, 'project.json'), 'utf8'));
  } catch {
    addDiagnostic(diagnostics, 'ERROR', 'project.json', 'project.json is missing or is not valid JSON.');
    return { diagnostics, runtimeWarnings: [] };
  }
  const parsed = ProjectSchema.safeParse(raw);
  if (!parsed.success) {
    addZodDiagnostics(diagnostics, parsed.error.issues);
    return { diagnostics, runtimeWarnings: [] };
  }
  const project = parsed.data as Project;
  for (const issue of validateProject(project)) {
    addDiagnostic(diagnostics, issue.severity === 'error' ? 'ERROR' : 'WARN', issue.section ? `${issue.section}${issue.entityId ? `.${issue.entityId}` : ''}` : 'project', issue.message);
  }
  await addSemanticDiagnostics(root, project, diagnostics);
  const runtimeWarnings = buildRuntimeBundle(project).warnings;
  return { project, diagnostics, runtimeWarnings };
}

function hasErrors(diagnostics: Diagnostic[]): boolean {
  return diagnostics.some((item) => item.level === 'ERROR');
}

export function formatDiagnostics(diagnostics: Diagnostic[]): string[] {
  return diagnostics.map((item) => `${item.level} ${item.path}: ${item.message}`);
}

async function collectFiles(root: string, current = root): Promise<string[]> {
  const entries = await fs.readdir(current, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    if (entry.name === '.sts2cc') continue;
    const fullPath = path.join(current, entry.name);
    if (entry.isDirectory()) files.push(...await collectFiles(root, fullPath));
    else if (entry.isFile()) files.push(path.relative(root, fullPath).split(path.sep).join('/'));
  }
  return files.sort();
}

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function u16(value: number): Buffer {
  const buffer = Buffer.alloc(2);
  buffer.writeUInt16LE(value, 0);
  return buffer;
}

function u32(value: number): Buffer {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32LE(value >>> 0, 0);
  return buffer;
}

export async function packProjectFolder(folderPath: string, outputPath?: string): Promise<string> {
  const root = path.resolve(folderPath);
  const inspection = await inspectProjectFolder(root);
  if (!inspection.project || hasErrors(inspection.diagnostics)) throw new ToolError('Project validation failed.', inspection.diagnostics);
  const files = await collectFiles(root);
  const chunks: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;
  for (const file of files) {
    const name = Buffer.from(file, 'utf8');
    const data = await fs.readFile(path.join(root, ...file.split('/')));
    const crc = crc32(data);
    const local = Buffer.concat([u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0), name, data]);
    chunks.push(local);
    const centralEntry = Buffer.concat([u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), name]);
    central.push(centralEntry);
    offset += local.length;
  }
  const centralDirectory = Buffer.concat(central);
  const end = Buffer.concat([u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length), u32(centralDirectory.length), u32(offset), u16(0)]);
  const destination = path.resolve(outputPath ?? path.join(path.dirname(root), `${inspection.project.name.replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'character'}.sts2char`));
  await fs.writeFile(destination, Buffer.concat([...chunks, centralDirectory, end]));
  return destination;
}

function readU16(data: Buffer, offset: number): number { return data.readUInt16LE(offset); }
function readU32(data: Buffer, offset: number): number { return data.readUInt32LE(offset); }

function archivePath(value: string): string {
  const normalized = value.replaceAll('\\', '/');
  if (!normalized || normalized.startsWith('/') || /^[A-Za-z]:\//.test(normalized) || normalized.split('/').some((part) => !part || part === '.' || part === '..')) throw new ToolError('Archive contains an unsafe path.', [diagnostic('ERROR', normalized || 'archive', 'Archive entries must be relative and must not contain . or .. segments.')]);
  return normalized;
}

export async function extractArchive(archiveFile: string, destination: string): Promise<string> {
  const data = await fs.readFile(archiveFile);
  let endOffset = -1;
  for (let offset = data.length - 22; offset >= Math.max(0, data.length - 0xffff - 22); offset -= 1) {
    if (readU32(data, offset) === 0x06054b50) { endOffset = offset; break; }
  }
  if (endOffset < 0) throw new ToolError('Archive is not a valid ZIP container.');
  const count = readU16(data, endOffset + 10);
  const centralSize = readU32(data, endOffset + 12);
  const centralOffset = readU32(data, endOffset + 16);
  if (centralOffset + centralSize > data.length) throw new ToolError('Archive central directory is truncated.');
  await fs.mkdir(destination, { recursive: true });
  let cursor = centralOffset;
  let projectJson = false;
  const seen = new Set<string>();
  for (let index = 0; index < count; index += 1) {
    if (readU32(data, cursor) !== 0x02014b50) throw new ToolError('Archive central directory is invalid.');
    const method = readU16(data, cursor + 10);
    const crc = readU32(data, cursor + 16);
    const compressedSize = readU32(data, cursor + 20);
    const uncompressedSize = readU32(data, cursor + 24);
    const nameLength = readU16(data, cursor + 28);
    const extraLength = readU16(data, cursor + 30);
    const commentLength = readU16(data, cursor + 32);
    const localOffset = readU32(data, cursor + 42);
    const name = archivePath(data.subarray(cursor + 46, cursor + 46 + nameLength).toString('utf8'));
    cursor += 46 + nameLength + extraLength + commentLength;
    if (seen.has(name)) throw new ToolError('Archive contains duplicate entries.', [diagnostic('ERROR', name, 'Archive entry is duplicated.')]);
    seen.add(name);
    if (readU32(data, localOffset) !== 0x04034b50) throw new ToolError('Archive local entry is invalid.');
    const localNameLength = readU16(data, localOffset + 26);
    const localExtraLength = readU16(data, localOffset + 28);
    const start = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = data.subarray(start, start + compressedSize);
    const content = method === 0 ? compressed : method === 8 ? inflateRawSync(compressed) : (() => { throw new ToolError('Archive compression method is unsupported.', [diagnostic('ERROR', name, `Unsupported method: ${method}`)]); })();
    if (content.length !== uncompressedSize || crc32(content) !== crc) throw new ToolError('Archive entry failed integrity validation.', [diagnostic('ERROR', name, 'CRC or size check failed.')]);
    if (name === 'project.json') projectJson = true;
    const output = path.resolve(destination, ...name.split('/'));
    const destinationRoot = `${path.resolve(destination)}${path.sep}`;
    if (!output.startsWith(destinationRoot)) throw new ToolError('Archive contains an unsafe path.');
    await fs.mkdir(path.dirname(output), { recursive: true });
    await fs.writeFile(output, content);
  }
  if (!projectJson) throw new ToolError('Archive must contain project.json.');
  return destination;
}

export async function verifyArchive(archiveFile: string): Promise<Inspection> {
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'sts2-character-verify-'));
  try {
    await extractArchive(archiveFile, temporary);
    return await inspectProjectFolder(temporary);
  } finally {
    await fs.rm(temporary, { recursive: true, force: true });
  }
}

function printInspection(inspection: Inspection): void {
  for (const line of formatDiagnostics(inspection.diagnostics)) console.log(line);
}

async function commandValidate(folder: string): Promise<number> {
  const inspection = await inspectProjectFolder(folder);
  printInspection(inspection);
  if (hasErrors(inspection.diagnostics)) { console.log('FAIL'); return 1; }
  console.log('PASS');
  return 0;
}

async function commandPack(folder: string): Promise<number> {
  const inspection = await inspectProjectFolder(folder);
  printInspection(inspection);
  if (hasErrors(inspection.diagnostics)) { console.log('FAIL'); return 1; }
  const output = await packProjectFolder(folder);
  console.log('PASS');
  console.log(`Created: ${output}`);
  return 0;
}

async function commandVerify(file: string): Promise<number> {
  const inspection = await verifyArchive(file);
  printInspection(inspection);
  if (hasErrors(inspection.diagnostics)) { console.log('FAIL'); return 1; }
  console.log('PASS');
  console.log('Native import verification: PASS');
  return 0;
}

async function commandBuild(folder: string): Promise<number> {
  const inspection = await inspectProjectFolder(folder);
  printInspection(inspection);
  if (hasErrors(inspection.diagnostics)) { console.log('FAIL'); return 1; }
  const output = await packProjectFolder(folder);
  const verified = await verifyArchive(output);
  printInspection(verified);
  if (hasErrors(verified.diagnostics)) { console.log('FAIL'); return 1; }
  console.log('PASS');
  console.log(`Created: ${output}`);
  console.log('Native import verification: PASS');
  return 0;
}

export async function main(args = process.argv.slice(2)): Promise<number> {
  const [command, value] = args;
  if (!command || !value || !['validate', 'pack', 'verify', 'build'].includes(command)) {
    console.error('Usage: character-cli.ts <validate|pack|verify|build> <project-folder|file.sts2char>');
    return 2;
  }
  try {
    if (command === 'validate') return await commandValidate(value);
    if (command === 'pack') return await commandPack(value);
    if (command === 'verify') return await commandVerify(value);
    return await commandBuild(value);
  } catch (error) {
    if (error instanceof ToolError) {
      console.error(error.message);
      for (const line of formatDiagnostics(error.diagnostics)) console.error(line);
    } else console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = await main();
