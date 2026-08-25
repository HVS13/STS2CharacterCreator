import { useEffect, useMemo, useState } from 'react';
import type { ArtworkAsset, Card, DialogueEntry, Project, Relic, RuntimeStatus, SectionId, Status } from './types';
import { useProjectStore } from './store/useProjectStore';
import { createId, makeCard, makeRelic } from './lib/model';
import { ProjectSchema } from './lib/schema';
import { validateProject } from './lib/validation';
import { buildRuntimeBundle } from './lib/runtimeAdapter';
import {
  assetDataUrl,
  chooseDirectory,
  chooseExportPath,
  chooseImage,
  chooseProjectArchive,
  copyAsset,
  deployRuntime,
  detectRuntime,
  exportProject,
  importProject,
  isTauri,
  launchGame,
  loadProjectFolder,
  prepareRuntime,
  rollbackRuntime,
  setupRuntime,
  saveProjectFolder,
} from './lib/tauri';
import { Sidebar } from './components/Sidebar';
import { PreviewPane } from './components/PreviewPane';
import { CardCollectionEditor } from './components/CardCollectionEditor';
import { CharacterEditor } from './components/CharacterEditor';
import { StatusEditor, newStatus } from './components/StatusEditor';
import { BasicCollectionEditor, EditableEntity, BasicCollectionKey, RelicEditor, newBasicEntity, newRelic } from './components/CollectionsEditor';
import { ArtworkEditor, LocalizationEditor, LoreEditor } from './components/PresentationEditors';
import { SettingsEditor } from './components/SettingsEditor';
import { Badge, EmptyState } from './components/Field';

const sectionLabels: Record<SectionId, string> = {
  character: 'Character',
  cards: 'Cards',
  relics: 'Relics',
  potions: 'Potions',
  enchantments: 'Enchantments',
  statuses: 'Statuses',
  stances: 'Stances',
  orbs: 'Orbs',
  companions: 'Companions',
  artwork: 'Artwork',
  lore: 'Dialogue & Lore',
  localization: 'Localization',
  settings: 'Settings',
};

const basicSections: BasicCollectionKey[] = ['potions', 'enchantments', 'stances', 'orbs', 'companions'];

function basicItems(project: Project, section: BasicCollectionKey): EditableEntity[] {
  if (section === 'potions') return project.potions as EditableEntity[];
  if (section === 'enchantments') return project.enchantments as EditableEntity[];
  return project.mechanics[section] as EditableEntity[];
}

function fileNameFromPath(path: string): string {
  return path.split(/[\\/]/).pop() || 'artwork.png';
}

function assetMime(path: string): 'image/png' | 'image/jpeg' {
  return path.toLocaleLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
}

function App() {
  const {
    project, projectPath, selectedSection, selectedId, dirty, selectSection,
    updateProject, replaceProject, setProjectPath, markSaved, undo, redo, newProject,
  } = useProjectStore();
  const [artworkPreviews, setArtworkPreviews] = useState<Record<string, string>>({});
  const [runtime, setRuntime] = useState<RuntimeStatus | null>(null);
  const [locale, setLocale] = useState('en');
  const [notice, setNotice] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [playOpen, setPlayOpen] = useState(false);
  const [playAcknowledged, setPlayAcknowledged] = useState(false);
  const [backupPath, setBackupPath] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  const issues = useMemo(() => validateProject(project), [project]);
  const errors = issues.filter((item) => item.severity === 'error');
  const selectedCard = project.cards.find((card) => card.id === selectedId) ?? project.cards[0];

  const announce = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice((current) => current === message ? null : current), 4500);
  };

  // Reload saved project artwork previews after opening a folder.
  useEffect(() => {
    if (!isTauri() || !projectPath || project.presentation.artwork.length === 0) {
      if (project.presentation.artwork.length === 0) setArtworkPreviews({});
      return;
    }
    let cancelled = false;
    const load = async () => {
      const entries = await Promise.all(project.presentation.artwork.map(async (asset) => {
        try {
          const absolutePath = projectPath.replace(/[\\/]+$/, '') + '/' + asset.relativePath;
          const preview = await assetDataUrl(absolutePath, asset.mimeType);
          return preview ? [asset.id, preview] as const : null;
        } catch {
          return null;
        }
      }));
      if (!cancelled) {
        setArtworkPreviews(Object.fromEntries(entries.filter((entry): entry is readonly [string, string] => Boolean(entry))));
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [projectPath, project.presentation.artwork]);
  const select = (section: SectionId, id?: string | null) => {
    selectSection(section, id ?? null);
  };

  const saveCurrent = async (): Promise<string | null> => {
    setWorking(true);
    try {
      let root = projectPath;
      if (!root) root = await chooseDirectory();
      if (!root && !isTauri()) root = 'browser-project';
      if (!root) return null;
      await saveProjectFolder(root, project);
      markSaved(root);
      announce('Project saved locally.');
      return root;
    } catch (error) {
      announce('Save failed: ' + (error instanceof Error ? error.message : String(error)));
      return null;
    } finally {
      setWorking(false);
    }
  };

  const openFolder = async () => {
    const root = await chooseDirectory();
    if (!root) return;
    setWorking(true);
    try {
      const parsed = ProjectSchema.parse(JSON.parse(await loadProjectFolder(root))) as unknown as Project;
      replaceProject(parsed, root);
      announce('Project opened.');
    } catch (error) {
      announce('Open failed: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setWorking(false);
    }
  };

  const newLocalProject = () => {
    if (dirty && !window.confirm('Discard unsaved project changes and start a new project?')) return;
    newProject();
    setArtworkPreviews({});
    announce('New project created. Save it to a local folder when ready.');
  };

  const importArchive = async () => {
    const archive = await chooseProjectArchive();
    if (!archive) return;
    const root = await chooseDirectory();
    if (!root) return;
    setWorking(true);
    try {
      await importProject(archive, root);
      const parsed = ProjectSchema.parse(JSON.parse(await loadProjectFolder(root))) as unknown as Project;
      replaceProject(parsed, root);
      announce('Portable project imported.');
    } catch (error) {
      announce('Import failed: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setWorking(false);
    }
  };

  const exportArchive = async () => {
    let root = projectPath;
    if (!root) root = await saveCurrent();
    if (!root) return;
    const destination = await chooseExportPath(project.name.replace(/\s+/g, '-').toLocaleLowerCase() + '.sts2char');
    if (!destination) return;
    setWorking(true);
    try {
      await exportProject(root, destination);
      announce('Portable .sts2char archive exported.');
    } catch (error) {
      announce('Export failed: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setWorking(false);
    }
  };

  const chooseArtworkFor = async (kind: ArtworkAsset['kind'], targetId?: string) => {
    const source = await chooseImage();
    if (!source) return;
    let root = projectPath;
    if (!root) root = await chooseDirectory();
    if (!root && !isTauri()) root = 'browser-project';
    if (!root) return;
    setWorking(true);
    try {
      const fileName = fileNameFromPath(source);
      const copied = await copyAsset(source, root, kind, fileName);
      const mimeType = assetMime(source);
      const previousAssetId = kind === 'card' && targetId
        ? project.cards.find((entry) => entry.id === targetId)?.artworkAssetId
        : kind === 'character' ? project.character.artworkAssetId : undefined;
      const assetId = previousAssetId ?? createId('art');
      const asset: ArtworkAsset = { id: assetId, name: fileName.replace(/\.[^.]+$/, ''), relativePath: copied.relative_path, kind, mimeType };
      updateProject((item) => {
        const existing = item.presentation.artwork.find((entry) => entry.id === assetId);
        if (existing) Object.assign(existing, asset);
        else item.presentation.artwork.push(asset);
        if (kind === 'card' && targetId) {
          const card = item.cards.find((entry) => entry.id === targetId);
          if (card) card.artworkAssetId = assetId;
        }
        if (kind === 'character') item.character.artworkAssetId = assetId;
      });
      setProjectPath(root);
      const preview = await assetDataUrl(copied.absolute_path, mimeType);
      if (preview) setArtworkPreviews((current) => ({ ...current, [assetId]: preview }));
      announce(previousAssetId ? 'Artwork replaced in the project assets folder.' : 'Artwork copied into the project assets folder.');
    } catch (error) {
      announce('Artwork import failed: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setWorking(false);
    }
  };

  const updateCard = (cardId: string, updater: (card: Card) => void) => updateProject((item) => {
    const card = item.cards.find((entry) => entry.id === cardId);
    if (card) updater(card);
  });

  const addCard = () => {
    const card = makeCard({ name: 'New Card' });
    updateProject((item) => { item.cards.push(card); });
    select('cards', card.id);
    announce('Card added.');
  };

  const duplicateCard = (card: Card) => {
    const copy = structuredClone(card);
    copy.id = createId('card');
    copy.name = card.name + ' Copy';
    copy.effects = copy.effects.map((effect) => ({ ...effect, id: createId('effect') }));
    if (copy.upgrade) copy.upgrade.effects = copy.upgrade.effects.map((effect) => ({ ...effect, id: createId('effect') }));
    updateProject((item) => { const index = item.cards.findIndex((entry) => entry.id === card.id); item.cards.splice(index + 1, 0, copy); });
    select('cards', copy.id);
    announce('Card duplicated.');
  };

  const deleteCard = (cardId: string) => {
    updateProject((item) => {
      item.cards = item.cards.filter((card) => card.id !== cardId);
      item.character.startingDeck = item.character.startingDeck.filter((entry) => entry.cardId !== cardId);
    });
    select('cards', null);
    announce('Card deleted. Use Ctrl+Z to undo.');
  };

  const addStatus = () => {
    const status = newStatus();
    updateProject((item) => { item.mechanics.statuses.push(status); });
    select('statuses', status.id);
    announce('Status added.');
  };

  const updateStatus = (index: number, updater: (status: Status) => void) => updateProject((item) => {
    const status = item.mechanics.statuses[index];
    if (status) updater(status);
  });

  const deleteStatus = (index: number) => {
    updateProject((item) => { item.mechanics.statuses.splice(index, 1); });
    select('statuses', null);
    announce('Status deleted. Use Ctrl+Z to undo.');
  };

  const addRelic = () => {
    const relic = newRelic();
    updateProject((item) => { item.relics.push(relic); });
    select('relics', relic.id);
    announce('Relic added.');
  };

  const updateRelic = (index: number, updater: (relic: Relic) => void) => updateProject((item) => {
    const relic = item.relics[index];
    if (relic) updater(relic);
  });

  const deleteRelic = (index: number) => {
    updateProject((item) => { const deleted = item.relics.splice(index, 1)[0]; if (deleted) item.character.startingRelics = item.character.startingRelics.filter((id) => id !== deleted.id); });
    select('relics', null);
    announce('Relic deleted. Use Ctrl+Z to undo.');
  };
  const addBasic = (section: BasicCollectionKey) => {
    const base = newBasicEntity();
    const item = section === 'potions' ? { ...base, rarity: 'common' as const } : section === 'enchantments' ? { ...base, effectText: '' } : base;
    updateProject((projectItem) => {
      if (section === 'potions') projectItem.potions.push({ id: item.id, name: item.name, description: item.description, rarity: item.rarity === 'rare' || item.rarity === 'uncommon' ? item.rarity : 'common' });
      else if (section === 'enchantments') projectItem.enchantments.push({ id: item.id, name: item.name, description: item.description, effectText: item.effectText ?? '' });
      else projectItem.mechanics[section].push(item);
    });
    select(section, item.id);
    announce(sectionLabels[section] + ' entry added.');
  };

  const updateBasic = (section: BasicCollectionKey, index: number, patch: Partial<EditableEntity>) => updateProject((item) => {
    const collection = basicItems(item, section);
    if (collection[index]) Object.assign(collection[index], patch);
  });

  const deleteBasic = (section: BasicCollectionKey, index: number) => {
    updateProject((item) => {
      if (section === 'potions') item.potions.splice(index, 1);
      else if (section === 'enchantments') item.enchantments.splice(index, 1);
      else item.mechanics[section].splice(index, 1);
    });
    select(section, null);
    announce(sectionLabels[section] + ' entry deleted. Use Ctrl+Z to undo.');
  };

  const addLore = () => {
    const entry: DialogueEntry = { id: createId('dialogue'), key: 'new.dialogue', text: '' };
    updateProject((item) => { item.presentation.dialogue.push(entry); });
    select('lore', entry.id);
  };

  const updateLore = (index: number, updater: (entry: DialogueEntry) => void) => updateProject((item) => {
    if (item.presentation.dialogue[index]) updater(item.presentation.dialogue[index]);
  });

  const deleteLore = (index: number) => {
    updateProject((item) => { item.presentation.dialogue.splice(index, 1); });
    select('lore', null);
    announce('Lore entry deleted. Use Ctrl+Z to undo.');
  };

  const updateArtwork = (index: number, updater: (asset: ArtworkAsset) => void) => updateProject((item) => {
    if (item.presentation.artwork[index]) updater(item.presentation.artwork[index]);
  });

  const deleteArtwork = (index: number) => {
    updateProject((item) => {
      const deleted = item.presentation.artwork.splice(index, 1)[0];
      if (!deleted) return;
      item.cards.forEach((card) => { if (card.artworkAssetId === deleted.id) card.artworkAssetId = undefined; });
      if (item.character.artworkAssetId === deleted.id) item.character.artworkAssetId = undefined;
    });
    select('artwork', null);
    announce('Artwork removed. Use Ctrl+Z to undo.');
  };

  const updateLocale = (localeKey: string, key: string, value: string) => updateProject((item) => {
    if (!item.presentation.locales[localeKey]) item.presentation.locales[localeKey] = {};
    item.presentation.locales[localeKey][key] = value;
  });

  const detect = async () => {
    setWorking(true);
    try {
      setRuntime(await detectRuntime());
      announce('Runtime detection finished.');
    } catch (error) {
      announce('Runtime detection failed: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setWorking(false);
    }
  };

  const runSetup = async () => {
    setWorking(true);
    try {
      setRuntime(await setupRuntime());
      announce('Runtime is ready.');
    } catch (error) {
      announce('Runtime setup failed: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setWorking(false);
    }
  };
  const openPlay = () => {
    if (errors.length) {
      select('settings');
      announce('Fix validation errors before Play.');
      return;
    }
    setPlayAcknowledged(false);
    setPlayOpen(true);
    if (!runtime) void detect();
  };

  const runPlay = async () => {
    if (!playAcknowledged) return;
    if (!runtime?.game_found || !runtime.base_lib_found || !runtime.blank_found) {
      announce('Set up Runtime before Play.');
      return;
    }
    setWorking(true);
    try {
      const root = projectPath ?? await saveCurrent();
      if (!root) return;
      const bundle = buildRuntimeBundle(project);
      await prepareRuntime(root, bundle.files);
      const deployment = await deployRuntime(project.id, bundle.files);
      setBackupPath(deployment.backup_path);
      await launchGame();
      announce('Runtime launched. The deployment backup is ready for rollback.');
    } catch (error) {
      announce('Play failed: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setWorking(false);
    }
  };

  const rollback = async () => {
    if (!backupPath) return;
    setWorking(true);
    try {
      await rollbackRuntime(backupPath);
      setBackupPath(null);
      announce('Runtime rollback completed.');
    } catch (error) {
      announce('Rollback failed: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setWorking(false);
    }
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const editingText = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable;
      if ((event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase() === 's') { event.preventDefault(); void saveCurrent(); }
      if ((event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase() === 'z' && !event.shiftKey) { event.preventDefault(); undo(); }
      if ((event.ctrlKey || event.metaKey) && (event.key.toLocaleLowerCase() === 'y' || (event.key.toLocaleLowerCase() === 'z' && event.shiftKey))) { event.preventDefault(); redo(); }
      if ((event.ctrlKey || event.metaKey) && ['k', 'f'].includes(event.key.toLocaleLowerCase())) { event.preventDefault(); setSearchOpen(true); }
      if ((event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase() === 'n') { event.preventDefault(); newLocalProject(); }
      if (event.key === 'Escape') { setSearchOpen(false); setPlayOpen(false); }
      if (event.key === 'Delete' && !editingText) {
        event.preventDefault();
        if (selectedSection === 'cards' && selectedCard) {
          deleteCard(selectedCard.id);
        } else if (selectedSection === 'relics' && selectedId) {
          const index = project.relics.findIndex((item) => item.id === selectedId);
          if (index >= 0) deleteRelic(index);
        } else if (selectedSection === 'statuses' && selectedId) {
          const index = project.mechanics.statuses.findIndex((item) => item.id === selectedId);
          if (index >= 0) deleteStatus(index);
        } else if (basicSections.includes(selectedSection as BasicCollectionKey) && selectedId) {
          const section = selectedSection as BasicCollectionKey;
          const index = basicItems(project, section).findIndex((item) => item.id === selectedId);
          if (index >= 0) deleteBasic(section, index);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  useEffect(() => {
    if (!dirty || !projectPath) return;
    const timer = window.setTimeout(() => {
      void saveProjectFolder(projectPath, project).then(() => markSaved(projectPath)).catch(() => undefined);
    }, 900);
    return () => window.clearTimeout(timer);
  }, [dirty, projectPath, project, markSaved]);
  const searchItems = useMemo(() => {
    const items: Array<{ id: string; name: string; section: SectionId; detail: string }> = [];
    items.push({ id: project.id, name: project.character.name, section: 'character', detail: 'Character' });
    project.cards.forEach((item) => items.push({ id: item.id, name: item.name, section: 'cards', detail: 'Card' }));
    project.relics.forEach((item) => items.push({ id: item.id, name: item.name, section: 'relics', detail: 'Relic' }));
    project.mechanics.statuses.forEach((item) => items.push({ id: item.id, name: item.name, section: 'statuses', detail: 'Status' }));
    basicSections.forEach((section) => basicItems(project, section).forEach((item) => items.push({ id: item.id, name: item.name, section, detail: sectionLabels[section] })));
    return items.filter((item) => !search.trim() || (item.name + ' ' + item.detail).toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  }, [project, search]);

  const renderEditor = () => {
    if (selectedSection === 'character') return <CharacterEditor project={project} artworkPreviews={artworkPreviews} onChange={updateProject} onChooseArtwork={() => void chooseArtworkFor('character')} />;
    if (selectedSection === 'cards') {
      if (!selectedCard) return <EmptyState title="No cards yet" text="Create your first card to start building the character's deck." action={<button className="primary-button" type="button" onClick={addCard}>Add card</button>} />;
      return <CardCollectionEditor cards={project.cards} project={project} selectedId={selectedId} artworkPreviews={artworkPreviews} onSelect={(id) => select('cards', id)} onChange={(updater) => updateCard(selectedCard.id, updater)} onDelete={(card) => deleteCard(card.id)} onDuplicate={duplicateCard} onChooseArtwork={(card) => void chooseArtworkFor('card', card.id)} onAdd={addCard} />
    }
    if (selectedSection === 'statuses') return <StatusEditor statuses={project.mechanics.statuses} selectedId={selectedId} onSelect={(id) => select('statuses', id)} onChange={updateStatus} onAdd={addStatus} onDelete={deleteStatus} />;
    if (selectedSection === 'relics') return <RelicEditor relics={project.relics} project={project} selectedId={selectedId} onSelect={(id) => select('relics', id)} onChange={updateRelic} onAdd={addRelic} onDelete={deleteRelic} />;
    if (basicSections.includes(selectedSection as BasicCollectionKey)) {
      const section = selectedSection as BasicCollectionKey;
      return <BasicCollectionEditor title={sectionLabels[section]} kind={section} items={basicItems(project, section)} selectedId={selectedId} onSelect={(id) => select(section, id)} onChange={(index, patch) => updateBasic(section, index, patch)} onAdd={() => addBasic(section)} onDelete={(index) => deleteBasic(section, index)} />;
    }
    if (selectedSection === 'artwork') return <ArtworkEditor project={project} selectedId={selectedId} previews={artworkPreviews} onSelect={(id) => select('artwork', id)} onChoose={() => void chooseArtworkFor('other')} onChange={updateArtwork} onDelete={deleteArtwork} />;
    if (selectedSection === 'lore') return <LoreEditor project={project} selectedId={selectedId} onSelect={(id) => select('lore', id)} onChange={updateLore} onAdd={addLore} onDelete={deleteLore} />;
    if (selectedSection === 'localization') return <LocalizationEditor project={project} locale={locale} setLocale={setLocale} onChange={updateLocale} />;
    return <SettingsEditor project={project} issues={issues} runtime={runtime} onChange={updateProject} onSetup={() => void runSetup()} working={working} onDetect={() => void detect()} onNew={newLocalProject} onSave={() => void saveCurrent()} onOpen={() => void openFolder()} onExport={() => void exportArchive()} onImport={() => void importArchive()} onPlay={openPlay} />;
  };
  return (
    <div className="app-shell">
      <Sidebar selected={selectedSection} onSelect={(section) => select(section)} issueCount={issues.length} />
      <main className="main-column">
        <header className="topbar">
          <div className="project-heading">
            <span className="eyebrow">Project</span>
            <input className="top-project-name" aria-label="Project name" value={project.name} onChange={(event) => updateProject((item) => { item.name = event.target.value; })} />
            <span className={'save-state' + (dirty ? ' unsaved' : '')}>{dirty ? 'Unsaved changes' : 'Saved locally'}</span>
          </div>
          <div className="top-actions">
            <button className="secondary-button" type="button" onClick={() => setSearchOpen(true)}>Search <span className="shortcut">Ctrl K</span></button>
            <button className="secondary-button" type="button" onClick={() => void saveCurrent()} disabled={working}>Save <span className="shortcut">Ctrl S</span></button>
            <button className="primary-button play-button" type="button" onClick={openPlay} disabled={working}>Play</button>
          </div>
        </header>
        <div className="content-heading">
          <div><span className="eyebrow">Editor</span><h1>{sectionLabels[selectedSection]}</h1></div>
          <div className="content-status"><Badge tone={errors.length ? 'danger' : issues.length ? 'warning' : 'success'}>{errors.length ? errors.length + ' errors' : issues.length ? issues.length + ' checks' : 'Ready to play'}</Badge>{projectPath && <span className="path-hint">{projectPath}</span>}</div>
        </div>
        <div className="workspace-grid">
          <section className="editor-surface" aria-label={sectionLabels[selectedSection] + ' editor'}>{renderEditor()}</section>
          <PreviewPane project={project} section={selectedSection} selectedCard={selectedSection === 'cards' ? selectedCard : undefined} artworkPreviews={artworkPreviews} />
        </div>
      </main>
      {notice && <div className="notice" role="status">{notice}</div>}
      {searchOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSearchOpen(false); }}>
        <section className="modal search-modal" role="dialog" aria-modal="true" aria-labelledby="search-title">
          <div className="modal-heading"><div><span className="eyebrow">Command palette</span><h2 id="search-title">Find project content</h2></div><button className="icon-button" type="button" aria-label="Close search" onClick={() => setSearchOpen(false)}>×</button></div>
          <input autoFocus className="search-input" aria-label="Search project content" placeholder="Search cards, relics, statuses..." value={search} onChange={(event) => setSearch(event.target.value)} />
          <div className="search-results">{searchItems.map((item) => <button type="button" className="search-result" key={item.section + item.id} onClick={() => { select(item.section, item.id); setSearchOpen(false); setSearch(''); }}><span><strong>{item.name || 'Unnamed item'}</strong><small>{item.detail}</small></span><span>Open</span></button>)}{searchItems.length === 0 && <p className="muted">No matching project content.</p>}</div>
          <div className="modal-footer"><span>Ctrl K to open</span><span>Esc to close</span></div>
        </section>
      </div>}
      {playOpen && <div className="modal-backdrop" role="presentation">
        <section className="modal play-modal" role="dialog" aria-modal="true" aria-labelledby="play-title">
          <div className="modal-heading"><div><span className="eyebrow">Runtime handoff</span><h2 id="play-title">Play {project.character.name}</h2></div><button className="icon-button" type="button" aria-label="Close Play dialog" onClick={() => setPlayOpen(false)}>×</button></div>
          <p>Play creates a backup, writes the generated runtime data, and opens Slay the Spire 2 through Steam. No project file is published.</p>
          {runtime ? <div className="runtime-panel compact-runtime"><div><span>Game</span><strong>{runtime.game_found ? 'Detected' : 'Not detected'}</strong><small>{runtime.game_path ?? 'Use Settings to troubleshoot detection.'}</small></div><div><span>Runtime</span><strong>{runtime.base_lib_found && runtime.blank_found ? 'Available' : 'Not verified'}</strong><small>{runtime.message}</small></div></div> : <button className="secondary-button" type="button" onClick={() => void detect()}>Detect runtime</button>}
          {buildRuntimeBundle(project).warnings.length > 0 && <div className="warning-box"><strong>Runtime limitations</strong>{buildRuntimeBundle(project).warnings.map((warning) => <p key={warning}>{warning}</p>)}</div>}
          <label className="acknowledgement"><input type="checkbox" checked={playAcknowledged} onChange={(event) => setPlayAcknowledged(event.target.checked)} /> I understand Play temporarily writes generated runtime data and can be rolled back.</label>
          <div className="modal-footer actions-footer"><button className="secondary-button" type="button" onClick={() => setPlayOpen(false)}>Cancel</button><button className="primary-button" type="button" disabled={!playAcknowledged || !runtime?.game_found || working} onClick={() => void runPlay()}>Create backup and launch</button>{backupPath && <button className="secondary-button danger-button" type="button" onClick={() => void rollback()}>Rollback</button>}</div>
          {backupPath && <p className="success-copy">A deployment backup exists. Roll back after closing the game.</p>}
        </section>
      </div>}
    </div>
  );
}

export default App;