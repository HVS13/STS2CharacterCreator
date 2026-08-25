import type { Status, StatusHook, DecayMode } from '../types';
import { makeStatus } from '../lib/model';
import { EmptyState, NumberField, SelectField, TextAreaField, TextField, Badge } from './Field';

interface StatusEditorProps {
  statuses: Status[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onChange: (index: number, updater: (status: Status) => void) => void;
  onAdd: () => void;
  onDelete: (index: number) => void;
}

const hookOptions: Array<[string, string]> = [['damage_dealt', 'Damage dealt'], ['damage_taken', 'Damage taken'], ['block_gained', 'Block gained'], ['energy_gain', 'Energy gained'], ['card_draw', 'Card drawn']];
const decayOptions: Array<[string, string]> = [['none', 'Does not decay'], ['lose_one_eot', 'Lose one at end of turn'], ['lose_all_eot', 'Lose all at end of turn']];

export function StatusEditor({ statuses, selectedId, onSelect, onChange, onAdd, onDelete }: StatusEditorProps) {
  const selectedIndex = Math.max(0, statuses.findIndex((status) => status.id === selectedId));
  const selected = statuses[selectedIndex];
  return (
    <div className="collection-editor">
      <section className="collection-list" aria-label="Statuses">
        <div className="collection-toolbar"><strong>Statuses</strong><button className="secondary-button" type="button" onClick={onAdd}>Add status</button></div>
        <div className="collection-items">
          {statuses.map((status, index) => <button type="button" className={'collection-item' + (selected?.id === status.id ? ' selected' : '')} key={status.id} onClick={() => onSelect(status.id)}><span><strong>{status.emoji} {status.name || 'Unnamed status'}</strong><small>{status.isBuff ? 'Buff' : 'Debuff'} · {status.hook.replace('_', ' ')}</small></span><Badge tone={status.amount > 0 ? 'success' : 'neutral'}>{status.amount}</Badge></button>)}
          {statuses.length === 0 && <EmptyState title="No statuses yet" text="Create a status to give cards and relics reusable mechanics." action={<button className="secondary-button" type="button" onClick={onAdd}>Create status</button>} />}
        </div>
      </section>
      {selected ? (
        <section className="detail-panel">
          <div className="editor-title-row"><div><p className="eyebrow">Status definition</p><h2>{selected.name || 'Unnamed status'}</h2></div><button className="text-button danger-text" type="button" onClick={() => onDelete(selectedIndex)}>Delete</button></div>
          <div className="form-grid">
            <TextField label="Name" value={selected.name} onChange={(event) => onChange(selectedIndex, (item) => { item.name = event.target.value; })} />
            <TextField label="Icon or symbol" value={selected.emoji} onChange={(event) => onChange(selectedIndex, (item) => { item.emoji = event.target.value; })} />
            <SelectField label="Type" options={[['true', 'Buff'], ['false', 'Debuff']]} value={String(selected.isBuff)} onChange={(event) => onChange(selectedIndex, (item) => { item.isBuff = event.target.value === 'true'; })} />
            <NumberField label="Starting amount" min={0} max={999} value={selected.amount} onChange={(event) => onChange(selectedIndex, (item) => { item.amount = Number(event.target.value); })} />
            <SelectField label="Supported hook" options={hookOptions} value={selected.hook} onChange={(event) => onChange(selectedIndex, (item) => { item.hook = event.target.value as StatusHook; })} />
            <SelectField label="Decay" options={decayOptions} value={selected.decay} onChange={(event) => onChange(selectedIndex, (item) => { item.decay = event.target.value as DecayMode; })} />
          </div>
          <TextAreaField label="Description" rows={4} value={selected.description} onChange={(event) => onChange(selectedIndex, (item) => { item.description = event.target.value; })} />
          <label className="toggle-label"><input type="checkbox" checked={selected.singleStack} onChange={(event) => onChange(selectedIndex, (item) => { item.singleStack = event.target.checked; })} /> Limit this status to one stack</label>
          <div className="generated-copy"><span className="eyebrow">Runtime note</span><p>This status uses the proven additive hook vocabulary. Cards can apply it through their effect rows.</p></div>
        </section>
      ) : <EmptyState title="Select a status" text="Choose a status from the list or create the first one." />}
    </div>
  );
}

export function newStatus(): Status {
  return makeStatus();
}