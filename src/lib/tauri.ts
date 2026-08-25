import { invoke } from '@tauri-apps/api/core';
import { open, save } from '@tauri-apps/plugin-dialog';
import type { RuntimeStatus } from '../types';

export const isTauri = () => typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

export async function chooseDirectory(): Promise<string | null> {
  if (!isTauri()) return null;
  const result = await open({ directory: true, multiple: false, title: 'Choose project folder' });
  return typeof result === 'string' ? result : null;
}

export async function chooseProjectArchive(): Promise<string | null> {
  if (!isTauri()) return null;
  const result = await open({ multiple: false, title: 'Open .sts2char project', filters: [{ name: 'STS2 Character Project', extensions: ['sts2char'] }] });
  return typeof result === 'string' ? result : null;
}

export async function chooseImage(): Promise<string | null> {
  if (!isTauri()) return null;
  const result = await open({ multiple: false, title: 'Choose artwork', filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg'] }] });
  return typeof result === 'string' ? result : null;
}

export async function chooseExportPath(defaultName: string): Promise<string | null> {
  if (!isTauri()) return null;
  const result = await save({ defaultPath: defaultName, title: 'Export portable project', filters: [{ name: 'STS2 Character Project', extensions: ['sts2char'] }] });
  return typeof result === 'string' ? result : null;
}

export async function saveProjectFolder(rootPath: string, project: unknown): Promise<void> {
  if (!isTauri()) {
    localStorage.setItem('sts2cc:project', JSON.stringify(project));
    return;
  }
  await invoke('write_project_file', { rootPath, contents: JSON.stringify(project, null, 2) });
}

export async function loadProjectFolder(rootPath: string): Promise<string> {
  if (!isTauri()) {
    const stored = localStorage.getItem('sts2cc:project');
    if (!stored) throw new Error('No saved browser project is available.');
    return stored;
  }
  return invoke<string>('read_project_file', { rootPath });
}

export async function copyAsset(sourcePath: string, projectRoot: string, kind: string, fileName: string): Promise<{ relative_path: string; absolute_path: string; bytes: number }> {
  if (!isTauri()) throw new Error('Artwork import is available in the desktop app.');
  return invoke('copy_asset', { sourcePath, projectRoot, assetKind: kind, fileName });
}

export async function assetDataUrl(path: string, mimeType: string): Promise<string> {
  if (!isTauri()) return '';
  const base64 = await invoke<string>('read_binary_base64', { path });
  return `data:${mimeType};base64,${base64}`;
}

export async function exportProject(rootPath: string, destination: string): Promise<void> {
  if (!isTauri()) throw new Error('Portable export is available in the desktop app.');
  await invoke('export_project', { sourceRoot: rootPath, destinationFile: destination });
}

export async function importProject(archiveFile: string, destinationRoot: string): Promise<void> {
  if (!isTauri()) throw new Error('Portable import is available in the desktop app.');
  await invoke('import_project', { archiveFile, destinationRoot });
}

export async function detectRuntime(): Promise<RuntimeStatus> {
  if (!isTauri()) {
    return { game_found: false, game_path: null, mods_path: null, base_lib_found: false, blank_found: false, game_version: null, message: 'Run the desktop app to detect your local STS2 installation.' };
  }
  return invoke<RuntimeStatus>('detect_runtime');
}

export async function prepareRuntime(projectRoot: string, files: Record<string, string>): Promise<{ staging_path: string; files_written: number }> {
  if (!isTauri()) return { staging_path: 'browser-preview', files_written: Object.keys(files).length };
  return invoke('prepare_runtime', { projectRoot, files });
}

export async function deployRuntime(projectId: string, files: Record<string, string>): Promise<{ backup_path: string; user_data_path: string; files_written: number }> {
  if (!isTauri()) throw new Error('Runtime deployment is available in the desktop app.');
  return invoke('deploy_runtime', { projectId, files });
}

export async function launchGame(): Promise<void> {
  if (!isTauri()) throw new Error('Play is available in the desktop app.');
  await invoke('launch_sts2');
}

export async function rollbackRuntime(backupPath: string): Promise<void> {
  if (!isTauri()) return;
  await invoke('rollback_runtime', { backupPath });
}
