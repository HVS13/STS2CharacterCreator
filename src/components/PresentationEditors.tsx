import type { ArtworkAsset, DialogueEntry, Project } from '../types';
import { EmptyState, SelectField, TextAreaField, TextField } from './Field';

export function ArtworkEditor({ project, selectedId, previews, onSelect, onChoose, onChange, onDelete }: {
  project: Project;
  selectedId: string | null;
  previews: Record<string, string>;
  onSelect: (id: string) => void;
  onChoose: () => void;
  onChange: (index: number, updater: (asset: ArtworkAsset) => void) => void;
  onDelete: (index: number) => void;
}) {
  const selectedIndex = Math.max(0, project.presentation.artwork.findIndex((asset) => asset.id === selectedId));
  const selected = project.presentation.artwork[selectedIndex];
  return (
    <div className="collection-editor">
      <section className="collection-list" aria-label="Artwork assets">
        <div className="collection-toolbar"><strong>Artwork</strong><button className="secondary-button" type="button" onClick={onChoose}>Choose image</button></div>
        <div className="collection-items">{project.presentation.artwork.map((asset) => <button type="button" className={'collection-item' + (selected?.id === asset.id ? ' selected' : '')} key={asset.id} onClick={() => onSelect(asset.id)}><span><strong>{asset.name}</strong><small>{asset.kind} · {asset.relativePath}</small></span></button>)}{project.presentation.artwork.length === 0 && <EmptyState title="No artwork yet" text="Choose a PNG or JPG. It will be copied into the project folder." action={<button className="secondary-button" type="button" onClick={onChoose}>Choose image</button>} />}</div>
      </section>
      {selected ? <section className="detail-panel">
        <div className="editor-title-row"><div><p className="eyebrow">Project asset</p><h2>{selected.name}</h2></div><button className="text-button danger-text" type="button" onClick={() => onDelete(selectedIndex)}>Remove asset</button></div>
        <TextField label="Asset name" value={selected.name} onChange={(event) => onChange(selectedIndex, (asset) => { asset.name = event.target.value; })} />
        <SelectField label="Usage" options={[['card', 'Card'], ['character', 'Character'], ['relic', 'Relic'], ['status', 'Status'], ['other', 'Other']]} value={selected.kind} onChange={(event) => onChange(selectedIndex, (asset) => { asset.kind = event.target.value as ArtworkAsset['kind']; })} />
        <div className="asset-preview-large">{previews[selected.id] ? <img src={previews[selected.id]} alt={selected.name} /> : <span>Preview unavailable until the desktop app reads the file.</span>}</div>
        <div className="path-display"><span>Stored path</span><code>{selected.relativePath}</code></div>
      </section> : <EmptyState title="Select an image" text="Choose an asset from the list or import your first image." />}
    </div>
  );
}

export function LoreEditor({ project, selectedId, onSelect, onChange, onAdd, onDelete }: {
  project: Project;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onChange: (index: number, updater: (entry: DialogueEntry) => void) => void;
  onAdd: () => void;
  onDelete: (index: number) => void;
}) {
  const selectedIndex = Math.max(0, project.presentation.dialogue.findIndex((entry) => entry.id === selectedId));
  const selected = project.presentation.dialogue[selectedIndex];
  return (
    <div className="collection-editor">
      <section className="collection-list" aria-label="Dialogue and lore">
        <div className="collection-toolbar"><strong>Dialogue & Lore</strong><button className="secondary-button" type="button" onClick={onAdd}>Add entry</button></div>
        <div className="collection-items">{project.presentation.dialogue.map((entry) => <button type="button" className={'collection-item' + (selected?.id === entry.id ? ' selected' : '')} key={entry.id} onClick={() => onSelect(entry.id)}><span><strong>{entry.key || 'Untitled key'}</strong><small>{entry.text || 'Empty text'}</small></span></button>)}{project.presentation.dialogue.length === 0 && <EmptyState title="No dialogue yet" text="Keep character lore and runtime-facing dialogue keys together." action={<button className="secondary-button" type="button" onClick={onAdd}>Add entry</button>} />}</div>
      </section>
      {selected ? <section className="detail-panel"><div className="editor-title-row"><div><p className="eyebrow">Localized text source</p><h2>{selected.key || 'Untitled key'}</h2></div><button className="text-button danger-text" type="button" onClick={() => onDelete(selectedIndex)}>Delete</button></div><TextField label="Key" value={selected.key} onChange={(event) => onChange(selectedIndex, (entry) => { entry.key = event.target.value; })} /><TextAreaField label="Text" rows={8} value={selected.text} onChange={(event) => onChange(selectedIndex, (entry) => { entry.text = event.target.value; })} /></section> : <EmptyState title="Select an entry" text="Choose a lore entry or add a new one." />}
    </div>
  );
}

export function LocalizationEditor({ project, locale, setLocale, onChange }: {
  project: Project;
  locale: string;
  setLocale: (locale: string) => void;
  onChange: (locale: string, key: string, value: string) => void;
}) {
  const values = project.presentation.locales[locale] ?? {};
  const keys = Array.from(new Set([...project.presentation.dialogue.map((entry) => entry.key).filter(Boolean), ...Object.keys(values)]));
  return (
    <div className="editor-stack">
      <div className="editor-title-row"><div><p className="eyebrow">Presentation</p><h2>Localization</h2></div><SelectField label="Locale" options={Object.keys(project.presentation.locales).map((key) => [key, key.toLocaleUpperCase()] as [string, string])} value={locale} onChange={(event) => setLocale(event.target.value)} /></div>
      <p className="section-copy">Keep translated strings in the project. The canonical source remains readable and can be exported later.</p>
      <div className="translation-table"><div className="translation-head"><span>Key</span><span>{locale.toLocaleUpperCase()} value</span></div>{keys.map((key) => <div className="translation-row" key={key}><code>{key}</code><input aria-label={'Translation for ' + key} value={values[key] ?? ''} onChange={(event) => onChange(locale, key, event.target.value)} /></div>)}</div>
      {keys.length === 0 && <EmptyState title="No translation keys yet" text="Add dialogue or lore entries first, then translate their keys here." />}
    </div>
  );
}