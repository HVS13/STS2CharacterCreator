import { useState } from 'react';
import type { BasicEntity, Effect, Project, Relic, RelicHook } from '../types';
import { makeEffect, makeRelic } from '../lib/model';
import { effectLabel } from '../lib/runtimeAdapter';
import { EmptyState, NumberField, SelectField, TextAreaField, TextField, Badge } from './Field';

export type EditableEntity = BasicEntity & { rarity?: string; effectText?: string };
export type BasicCollectionKey = 'potions' | 'enchantments' | 'stances' | 'orbs' | 'companions';

const effectOptions: Array<[string, string]> = [['damage', 'Deal damage'], ['block', 'Gain Block'], ['draw', 'Draw cards'], ['gain_energy', 'Gain Energy'], ['heal', 'Heal HP'], ['apply_status', 'Apply status']];
const targetOptions: Array<[string, string]> = [['enemy', 'Selected enemy'], ['self', 'Self'], ['allEnemies', 'All enemies'], ['none', 'No target']];
const triggerOptions: Array<[string, string]> = [['turn_start', 'Start of turn'], ['turn_end', 'End of turn'], ['attacked', 'When attacked'], ['on_card_played', 'After a card is played'], ['combat_end', 'End of combat'], ['on_damage_dealt', 'After damage dealt'], ['on_block_gained', 'After Block gained'], ['on_hp_lost', 'After HP lost']];
const tierOptions: Array<[string, string]> = [['starter', 'Starter'], ['common', 'Common'], ['uncommon', 'Uncommon'], ['rare', 'Rare'], ['boss', 'Boss'], ['shop', 'Shop']];
const potionRarityOptions: Array<[string, string]> = [['common', 'Common'], ['uncommon', 'Uncommon'], ['rare', 'Rare']];

export function newBasicEntity(): EditableEntity {
  return { id: crypto.randomUUID(), name: 'New item', description: '' };
}

export function BasicCollectionEditor({ title, kind, items, selectedId, onSelect, onChange, onAdd, onDelete }: {
  title: string;
  kind: BasicCollectionKey;
  items: EditableEntity[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onChange: (index: number, patch: Partial<EditableEntity>) => void;
  onAdd: () => void;
  onDelete: (index: number) => void;
}) {
  const selectedIndex = Math.max(0, items.findIndex((item) => item.id === selectedId));
  const selected = items[selectedIndex];
  const extraField = kind === 'potions' ? 'rarity' : kind === 'enchantments' ? 'effectText' : undefined;
  const extraLabel = extraField === 'rarity' ? 'Rarity' : 'Effect text';
  return (
    <div className="collection-editor">
      <section className="collection-list" aria-label={title}>
        <div className="collection-toolbar"><strong>{title}</strong><button className="secondary-button" type="button" onClick={onAdd}>Add</button></div>
        <div className="collection-items">
          {items.map((item) => <button type="button" className={'collection-item' + (selected?.id === item.id ? ' selected' : '')} key={item.id} onClick={() => onSelect(item.id)}><span><strong>{item.name || 'Unnamed item'}</strong><small>{item.description || 'No description'}</small></span></button>)}
          {items.length === 0 && <EmptyState title={'No ' + title.toLocaleLowerCase()} text="Create the first entry to make this part of the project editable." action={<button className="secondary-button" type="button" onClick={onAdd}>Create {title.slice(0, -1)}</button>} />}
        </div>
      </section>
      {selected ? (
        <section className="detail-panel">
          <div className="editor-title-row"><div><p className="eyebrow">{title.slice(0, -1)} definition</p><h2>{selected.name || 'Unnamed item'}</h2></div><button className="text-button danger-text" type="button" onClick={() => onDelete(selectedIndex)}>Delete</button></div>
          <TextField label="Name" value={selected.name} onChange={(event) => onChange(selectedIndex, { name: event.target.value })} />
          <TextAreaField label="Description" rows={4} value={selected.description} onChange={(event) => onChange(selectedIndex, { description: event.target.value })} />
          {extraField === 'rarity' && <SelectField label={extraLabel} options={potionRarityOptions} value={selected.rarity ?? 'common'} onChange={(event) => onChange(selectedIndex, { rarity: event.target.value })} />}
          {extraField === 'effectText' && <TextAreaField label={extraLabel} rows={3} value={selected.effectText ?? ''} onChange={(event) => onChange(selectedIndex, { effectText: event.target.value })} />}
        </section>
      ) : <EmptyState title={'Select a ' + title.slice(0, -1)} text="Choose an entry from the list or create the first one." />}
    </div>
  );
}

function HookEditor({ hook, project, onChange, onRemove }: { hook: RelicHook; project: Project; onChange: (updater: (hook: RelicHook) => void) => void; onRemove: () => void }) {
  return (
    <div className="hook-card">
      <div className="effect-row-top"><strong>Trigger</strong><button className="text-button danger-text" type="button" onClick={onRemove}>Remove hook</button></div>
      <div className="form-grid compact">
        <SelectField label="When" options={triggerOptions} value={hook.trigger} onChange={(event) => onChange((item) => { item.trigger = event.target.value as RelicHook['trigger']; })} />
        <label className="toggle-label inline-toggle"><input type="checkbox" checked={hook.oncePerCombat} onChange={(event) => onChange((item) => { item.oncePerCombat = event.target.checked; })} /> Once per combat</label>
      </div>
      {hook.effects.map((effect, index) => <div className="mini-effect" key={effect.id}>
        <SelectField label="Action" options={effectOptions} value={effect.type} onChange={(event) => onChange((item) => { item.effects[index].type = effect.type = event.target.value as Effect['type']; })} />
        <NumberField label="Amount" min={0} max={999} value={effect.amount ?? 0} onChange={(event) => onChange((item) => { item.effects[index].amount = Number(event.target.value); })} />
        <SelectField label="Target" options={targetOptions} value={effect.target ?? 'none'} onChange={(event) => onChange((item) => { item.effects[index].target = event.target.value as Effect['target']; })} />
        <span className="effect-sentence"><strong>{effectLabel(effect, project)}</strong></span>
        <button className="text-button danger-text" type="button" onClick={() => onChange((item) => { item.effects.splice(index, 1); })}>Remove effect</button>
      </div>)}
      <button className="text-button" type="button" onClick={() => onChange((item) => { item.effects.push(makeEffect('block', 3, { target: 'self' })); })}>Add effect</button>
    </div>
  );
}

export function RelicEditor({ relics, project, selectedId, onSelect, onChange, onAdd, onDelete }: {
  relics: Relic[];
  project: Project;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onChange: (index: number, updater: (relic: Relic) => void) => void;
  onAdd: () => void;
  onDelete: (index: number) => void;
}) {
  const selectedIndex = Math.max(0, relics.findIndex((relic) => relic.id === selectedId));
  const selected = relics[selectedIndex];
  const [hookIndex, setHookIndex] = useState(0);
  return (
    <div className="collection-editor">
      <section className="collection-list" aria-label="Relics">
        <div className="collection-toolbar"><strong>Relics</strong><button className="secondary-button" type="button" onClick={onAdd}>Add relic</button></div>
        <div className="collection-items">{relics.map((relic) => <button type="button" className={'collection-item' + (selected?.id === relic.id ? ' selected' : '')} key={relic.id} onClick={() => { onSelect(relic.id); setHookIndex(0); }}><span><strong>{relic.name || 'Unnamed relic'}</strong><small>{relic.tier} · {relic.hooks.length} trigger{relic.hooks.length === 1 ? '' : 's'}</small></span><Badge>{relic.tier}</Badge></button>)}{relics.length === 0 && <EmptyState title="No relics yet" text="Create a relic to define passive run behavior." action={<button className="secondary-button" type="button" onClick={onAdd}>Create relic</button>} />}</div>
      </section>
      {selected ? <section className="detail-panel">
        <div className="editor-title-row"><div><p className="eyebrow">Relic definition</p><h2>{selected.name || 'Unnamed relic'}</h2></div><button className="text-button danger-text" type="button" onClick={() => onDelete(selectedIndex)}>Delete</button></div>
        <div className="form-grid"><TextField label="Name" value={selected.name} onChange={(event) => onChange(selectedIndex, (item) => { item.name = event.target.value; })} /><SelectField label="Tier" options={tierOptions} value={selected.tier} onChange={(event) => onChange(selectedIndex, (item) => { item.tier = event.target.value as Relic['tier']; })} /></div>
        <TextAreaField label="Description" rows={4} value={selected.description} onChange={(event) => onChange(selectedIndex, (item) => { item.description = event.target.value; })} />
        <div className="subsection"><div className="subsection-heading"><div><h3>Triggers</h3><p>Use one or more supported runtime triggers.</p></div><button className="secondary-button" type="button" onClick={() => onChange(selectedIndex, (item) => { item.hooks.push({ id: crypto.randomUUID(), trigger: 'turn_start', oncePerCombat: true, effects: [makeEffect('block', 3, { target: 'self' })] }); })}>Add trigger</button></div>
          {selected.hooks.map((hook, index) => <HookEditor key={hook.id} hook={hook} project={project} onChange={(updater) => onChange(selectedIndex, (item) => updater(item.hooks[index]))} onRemove={() => onChange(selectedIndex, (item) => { item.hooks.splice(index, 1); })} />)}
          {selected.hooks.length === 0 && <p className="inline-warning">Add a trigger so the relic has behavior.</p>}
        </div>
      </section> : <EmptyState title="Select a relic" text="Choose a relic from the list or create the first one." />}
    </div>
  );
}

export function newRelic(): Relic {
  return makeRelic();
}