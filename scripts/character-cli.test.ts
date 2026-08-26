import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { extractArchive, inspectProjectFolder, packProjectFolder, verifyArchive } from './character-cli';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const exampleRoot = path.join(repositoryRoot, 'examples', 'ai-character');
const temporaryFolders: string[] = [];

async function makeFixture(name: string): Promise<string> {
  const parent = await fs.mkdtemp(path.join(os.tmpdir(), 'sts2-character-cli-test-'));
  temporaryFolders.push(parent);
  const folder = path.join(parent, name);
  await fs.cp(exampleRoot, folder, { recursive: true });
  return folder;
}

afterEach(async () => {
  await Promise.all(temporaryFolders.splice(0).map((folder) => fs.rm(folder, { recursive: true, force: true })));
});

describe('external character tooling', () => {
  it('validates, packs, and verifies the checked-in example', async () => {
    const inspection = await inspectProjectFolder(exampleRoot);
    expect(inspection.diagnostics.filter((item) => item.level === 'ERROR')).toEqual([]);

    const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'sts2-character-cli-archive-'));
    temporaryFolders.push(temporary);
    const archive = await packProjectFolder(exampleRoot, path.join(temporary, 'example.sts2char'));
    const verified = await verifyArchive(archive);
    expect(verified.diagnostics.filter((item) => item.level === 'ERROR')).toEqual([]);
  });

  it('preserves Unicode names, spaces, and local assets in a packed project', async () => {
    const folder = await makeFixture('Unicode Character Project');
    const projectPath = path.join(folder, 'project.json');
    const project = JSON.parse(await fs.readFile(projectPath, 'utf8')) as { name: string; character: { name: string }; cards: Array<{ name: string }> };
    project.name = '火 Character';
    project.character.name = '火 Character';
    project.cards[0].name = 'Strike with spaces';
    await fs.writeFile(projectPath, `${JSON.stringify(project, null, 2)}\n`, 'utf8');

    const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'sts2-character-cli-archive-'));
    temporaryFolders.push(temporary);
    const archive = await packProjectFolder(folder, path.join(temporary, 'unicode.sts2char'));
    const extracted = path.join(temporary, 'extracted');
    await extractArchive(archive, extracted);
    const extractedProject = JSON.parse(await fs.readFile(path.join(extracted, 'project.json'), 'utf8')) as { name: string };
    expect(extractedProject.name).toBe('火 Character');
    await expect(fs.readFile(path.join(extracted, 'assets', 'card', 'ai-strike.png'))).resolves.toEqual(await fs.readFile(path.join(folder, 'assets', 'card', 'ai-strike.png')));
  });

  it('rejects broken references, absolute paths, missing artwork, and malformed schema', async () => {
    const brokenReference = await makeFixture('broken-reference');
    const brokenProjectPath = path.join(brokenReference, 'project.json');
    const brokenProject = JSON.parse(await fs.readFile(brokenProjectPath, 'utf8')) as { character: { startingDeck: Array<{ cardId: string }> } };
    brokenProject.character.startingDeck[0].cardId = 'missing-card';
    await fs.writeFile(brokenProjectPath, JSON.stringify(brokenProject), 'utf8');
    const brokenInspection = await inspectProjectFolder(brokenReference);
    expect(brokenInspection.diagnostics.some((item) => item.level === 'ERROR' && item.message.includes('Missing card reference'))).toBe(true);

    const absolutePath = await makeFixture('absolute-path');
    const absoluteProjectPath = path.join(absolutePath, 'project.json');
    const absoluteProject = JSON.parse(await fs.readFile(absoluteProjectPath, 'utf8')) as { presentation: { artwork: Array<{ relativePath: string }> } };
    absoluteProject.presentation.artwork[0].relativePath = path.join(absolutePath, 'assets', 'card', 'ai-strike.png');
    await fs.writeFile(absoluteProjectPath, JSON.stringify(absoluteProject), 'utf8');
    const absoluteInspection = await inspectProjectFolder(absolutePath);
    expect(absoluteInspection.diagnostics.some((item) => item.level === 'ERROR' && item.path.includes('relativePath'))).toBe(true);

    const missingArtwork = await makeFixture('missing-artwork');
    await fs.rm(path.join(missingArtwork, 'assets', 'card', 'ai-strike.png'));
    const missingInspection = await inspectProjectFolder(missingArtwork);
    expect(missingInspection.diagnostics.some((item) => item.level === 'ERROR' && item.message.includes('Artwork file not found'))).toBe(true);

    const malformed = await makeFixture('malformed-schema');
    await fs.writeFile(path.join(malformed, 'project.json'), '{}', 'utf8');
    const malformedInspection = await inspectProjectFolder(malformed);
    expect(malformedInspection.diagnostics.some((item) => item.level === 'ERROR' && item.path === 'project.json.schemaVersion')).toBe(true);
  });
});
