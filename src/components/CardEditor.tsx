import type { Card, CardTarget, CardType, CardRarity, Condition, ConditionType, Effect, EffectType, Project } from '../types';
import { makeEffect } from '../lib/model';
import { cardDescription, conditionLabel, effectLabel } from '../lib/runtimeAdapter';
import { NumberField, SelectField, TextAreaField, TextField, Badge } from './Field';

interface CardEditorProps {
  card: Card;
  project: Project;
  artworkPreviews: Record<string, string>;
  onChange: (updater: (card: Card) => void) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onChooseArtwork: () => void;
}

const typeOptions: Array<[string, string]> = [['attack', 'Attack'], ['skill', 'Skill'], ['power', 'Power']];
const rarityOptions: Array<[string, string]> = [['basic', 'Basic'], ['common', 'Common'], ['uncommon', 'Uncommon'], ['rare', 'Rare'], ['token', 'Token']];
const targetOptions: Array<[string, string]> = [['enemy', 'Selected enemy'], ['self', 'Self'], ['allEnemies', 'All enemies'], ['none', 'No target']];
const effectOptions: Array<[string, string]> = [
  ['damage', 'Deal damage'], ['block', 'Gain Block'], ['draw', 'Draw cards'], ['gain_energy', 'Gain Energy'],
  ['heal', 'Heal HP'], ['lose_hp', 'Lose HP'], ['apply_status', 'Apply status'], ['apply_custom_status', 'Apply custom status'],
  ['upgrade_card', 'Upgrade a card'], ['retain', 'Retain'], ['innate', 'Innate'], ['exhaust', 'Exhaust'],
  ['ethereal', 'Ethereal'], ['scry', 'Scry'], ['gain_orb_slot', 'Gain Orb Slot'], ['channel_orb', 'Channel Orb'], ['summon', 'Summon companion'],
];
const conditionOptions: Array<[string, string]> = [
  ['', 'No condition'], ['turn_at_least', 'Turn is at least'], ['target_has_status', 'Target has status'],
  ['has_block', 'You have Block'], ['no_block', 'Target has no Block'], ['hp_below_half', 'Target below half HP'],
  ['hand_size_ge', 'Hand has at least'], ['draw_pile_empty', 'Draw pile is empty'],
];

function statusOptions(project: Project): Array<[string, string]> {
  return [['', 'Choose status'], ...project.mechanics.statuses.map((status) => [status.id, status.name] as [string, string])];
}

function updateEffect(card: Card, index: number, updater: (effect: Effect) => void, upgrade = false): void {
  const effects = upgrade ? card.upgrade?.effects : card.effects;
  if (!effects) return;
  const next = effects.map((effect, effectIndex) => {
    const copy = structuredClone(effect);
    if (effectIndex === index) updater(copy);
    return copy;
  });
  if (upgrade && card.upgrade) card.upgrade.effects = next;
  else card.effects = next;
}

function copyEffects(effects: Effect[]): Effect[] {
  return effects.map((effect) => ({ ...structuredClone(effect), id: crypto.randomUUID() }));
}

function EffectRow({ effect, index, project, onChange, onRemove, upgrade = false }: {
  effect: Effect;
  index: number;
  project: Project;
  onChange: (updater: (card: Card) => void) => void;
  onRemove: () => void;
  upgrade?: boolean;
}) {
  const conditionType = effect.condition?.type ?? '';
  const set = (updater: (item: Effect) => void) => onChange((card) => updateEffect(card, index, updater, upgrade));
  const setCondition = (condition: Condition | undefined) => set((item) => { item.condition = condition; });
  return (
    <div className="effect-row">
      <div className="effect-row-top">
        <strong>{upgrade ? 'Upgrade effect ' : 'Effect '}{index + 1}</strong>
        <button className="text-button danger-text" type="button" onClick={onRemove}>Remove</button>
      </div>
      <div className="form-grid compact">
        <SelectField label="Action" options={effectOptions} value={effect.type} onChange={(event) => set((item) => { item.type = event.target.value as EffectType; })} />
        <NumberField label="Amount" min={0} max={999} value={effect.amount ?? 0} onChange={(event) => set((item) => { item.amount = Number(event.target.value); })} />
        <SelectField label="Target" options={targetOptions} value={effect.target ?? 'none'} onChange={(event) => set((item) => { item.target = event.target.value as CardTarget; })} />
      </div>
      {(effect.type === 'apply_status' || effect.type === 'apply_custom_status' || conditionType === 'target_has_status') && (
        <SelectField label={conditionType === 'target_has_status' ? 'Condition status' : 'Status'} options={statusOptions(project)} value={conditionType === 'target_has_status' ? effect.condition?.statusId ?? '' : effect.statusId ?? ''} onChange={(event) => {
          const value = event.target.value;
          if (conditionType === 'target_has_status') setCondition(value ? { type: 'target_has_status', statusId: value } : undefined);
          else set((item) => { item.statusId = value || undefined; });
        }} />
      )}
      <div className="condition-line">
        <SelectField label="When" options={conditionOptions} value={conditionType} onChange={(event) => {
          const type = event.target.value as ConditionType | '';
          if (!type) setCondition(undefined);
          else setCondition({ type, value: ['turn_at_least', 'hand_size_ge'].includes(type) ? effect.condition?.value ?? 2 : undefined, statusId: type === 'target_has_status' ? effect.condition?.statusId : undefined });
        }} />
        {['turn_at_least', 'hand_size_ge'].includes(conditionType) && <NumberField label="Condition value" min={0} max={99} value={effect.condition?.value ?? 0} onChange={(event) => setCondition({ ...effect.condition, type: effect.condition?.type as ConditionType, value: Number(event.target.value) })} />}
      </div>
      <div className="effect-sentence"><span>{conditionLabel(effect.condition, project) || 'Always'}</span><strong>{effectLabel(effect, project)}</strong></div>
    </div>
  );
}

export function CardEditor({ card, project, artworkPreviews, onChange, onDelete, onDuplicate, onChooseArtwork }: CardEditorProps) {
  const artwork = card.artworkAssetId ? project.presentation.artwork.find((item) => item.id === card.artworkAssetId) : undefined;
  const artworkUrl = artwork ? artworkPreviews[artwork.id] : undefined;
  const set = (updater: (item: Card) => void) => onChange(updater);
  const toggleUpgrade = () => set((item) => {
    item.upgrade = item.upgrade ? undefined : { effects: copyEffects(item.effects) };
  });
  return (
    <div className="editor-stack">
      <div className="editor-title-row">
        <div><p className="eyebrow">Card definition</p><h2>{card.name || 'Unnamed card'}</h2></div>
        <div className="button-row">
          <button className="secondary-button" type="button" onClick={onDuplicate}>Duplicate</button>
          <button className="secondary-button danger-button" type="button" onClick={onDelete}>Delete</button>
        </div>
      </div>
      <div className="form-grid">
        <TextField label="Card name" value={card.name} onChange={(event) => set((item) => { item.name = event.target.value; })} />
        <SelectField label="Type" options={typeOptions} value={card.type} onChange={(event) => set((item) => { item.type = event.target.value as CardType; })} />
        <SelectField label="Rarity" options={rarityOptions} value={card.rarity} onChange={(event) => set((item) => { item.rarity = event.target.value as CardRarity; })} />
        <NumberField label="Cost" min={0} max={9} value={card.cost} onChange={(event) => set((item) => { item.cost = Number(event.target.value); })} />
        <SelectField label="Target" options={targetOptions} value={card.target} onChange={(event) => set((item) => { item.target = event.target.value as CardTarget; })} />
        <TextField label="Tags" helper="Separate tags with commas." value={card.tags.join(', ')} onChange={(event) => set((item) => { item.tags = event.target.value.split(',').map((tag) => tag.trim()).filter(Boolean); })} />
      </div>
      <TextAreaField label="Designer notes" rows={3} value={card.description ?? ''} onChange={(event) => set((item) => { item.description = event.target.value; })} />
      <div className="subsection">
        <div className="subsection-heading"><div><h3>Effects</h3><p>Build the card in readable actions. The generated sentence is shown below each row.</p></div><button className="secondary-button" type="button" onClick={() => set((item) => { item.effects.push(makeEffect('damage', 6, { target: item.target })); })}>Add effect</button></div>
        {card.effects.map((effect, index) => <EffectRow key={effect.id} effect={effect} index={index} project={project} onChange={onChange} onRemove={() => set((item) => { item.effects.splice(index, 1); })} />)}
        {card.effects.length === 0 && <p className="inline-warning">Add at least one effect.</p>}
      </div>
      <div className="subsection">
        <div className="subsection-heading"><div><h3>Upgrade</h3><p>Keep the same effect row count so the runtime can map the upgrade safely.</p></div><label className="toggle-label"><input type="checkbox" checked={Boolean(card.upgrade)} onChange={toggleUpgrade} /> Has upgrade</label></div>
        {card.upgrade && <div className="effect-list">{card.upgrade.effects.map((effect, index) => <EffectRow key={effect.id} effect={effect} index={index} project={project} onChange={onChange} upgrade onRemove={() => set((item) => { item.upgrade?.effects.splice(index, 1); })} />)}</div>}
        {card.upgrade && <NumberField label="Upgraded cost" min={0} max={9} value={card.upgrade.cost ?? card.cost} onChange={(event) => set((item) => { if (item.upgrade) item.upgrade.cost = Number(event.target.value); })} />}
      </div>
      <div className="subsection">
        <div className="subsection-heading"><div><h3>Artwork</h3><p>Images are copied into the project assets folder and referenced by relative path.</p></div><button className="secondary-button" type="button" onClick={onChooseArtwork}>{artwork ? 'Replace image' : 'Choose image'}</button></div>
        {artwork && <div className="asset-inline"><div className="asset-thumb" style={artworkUrl ? { backgroundImage: 'url(' + artworkUrl + ')' } : undefined}>{!artworkUrl && 'Image'}</div><div><strong>{artwork.name}</strong><small>{artwork.relativePath}</small><button className="text-button" type="button" onClick={() => set((item) => { item.artworkAssetId = undefined; })}>Remove</button></div></div>}
      </div>
      <div className="generated-copy"><span className="eyebrow">Player-facing description</span><p>{cardDescription(card, project)}</p>{card.upgrade && <p><strong>Upgrade:</strong> {cardDescription(card, project, true)}</p>}</div>
    </div>
  );
}