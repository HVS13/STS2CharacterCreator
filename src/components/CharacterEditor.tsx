import type { Project } from '../types';
import { NumberField, SelectField, TextAreaField, TextField } from './Field';

interface CharacterEditorProps {
  project: Project;
  artworkPreviews: Record<string, string>;
  onChange: (updater: (project: Project) => void) => void;
  onChooseArtwork: () => void;
}

export function CharacterEditor({ project, artworkPreviews, onChange, onChooseArtwork }: CharacterEditorProps) {
  const character = project.character;
  const characterArt = character.artworkAssetId ? project.presentation.artwork.find((asset) => asset.id === character.artworkAssetId) : undefined;
  const characterArtUrl = characterArt ? artworkPreviews[characterArt.id] : undefined;
  const cardOptions: Array<[string, string]> = project.cards.map((card) => [card.id, card.name] as [string, string]);
  const relicOptions: Array<[string, string]> = project.relics.map((relic) => [relic.id, relic.name] as [string, string]);
  return (
    <div className="editor-stack">
      <div className="editor-title-row"><div><p className="eyebrow">Character definition</p><h2>{character.name || 'Unnamed character'}</h2></div><span className="quiet-status">Local canonical data</span></div>
      <div className="form-grid">
        <TextField label="Character name" value={character.name} onChange={(event) => onChange((item) => { item.character.name = event.target.value; item.name = event.target.value || item.name; })} />
        <TextField label="Card pool color" type="color" value={character.cardPoolColor} onChange={(event) => onChange((item) => { item.character.cardPoolColor = event.target.value; })} />
        <NumberField label="Max HP" min={1} max={999} value={character.maxHp} onChange={(event) => onChange((item) => { item.character.maxHp = Number(event.target.value); })} />
        <NumberField label="Starting energy" min={1} max={10} value={character.maxEnergy} onChange={(event) => onChange((item) => { item.character.maxEnergy = Number(event.target.value); })} />
        <NumberField label="Starting gold" min={0} max={9999} value={character.startingGold} onChange={(event) => onChange((item) => { item.character.startingGold = Number(event.target.value); })} />
      </div>
      <TextAreaField label="Character description" rows={4} value={character.description} onChange={(event) => onChange((item) => { item.character.description = event.target.value; })} />
      <div className="subsection">
        <div className="subsection-heading"><div><h3>Starting deck</h3><p>Choose cards and counts for the initial deck.</p></div><button className="secondary-button" type="button" onClick={() => onChange((item) => { item.character.startingDeck.push({ cardId: item.cards[0]?.id ?? '', count: 1 }); })} disabled={project.cards.length === 0}>Add card</button></div>
        {character.startingDeck.map((entry, index) => (
          <div className="inline-row" key={index}>
            <SelectField label={'Card ' + (index + 1)} options={cardOptions.length ? cardOptions : [['', 'Create a card first']]} value={entry.cardId} onChange={(event) => onChange((item) => { item.character.startingDeck[index].cardId = event.target.value; })} />
            <NumberField label="Count" min={1} max={99} value={entry.count} onChange={(event) => onChange((item) => { item.character.startingDeck[index].count = Number(event.target.value); })} />
            <button className="text-button danger-text row-remove" type="button" onClick={() => onChange((item) => { item.character.startingDeck.splice(index, 1); })}>Remove</button>
          </div>
        ))}
        {character.startingDeck.length === 0 && <p className="muted">No starting cards. Add one to make the first run playable.</p>}
      </div>
      <div className="subsection">
        <div className="subsection-heading"><div><h3>Starting relics</h3><p>Select the relics granted at the start of a run.</p></div></div>
        <div className="check-list">
          {project.relics.map((relic) => <label key={relic.id}><input type="checkbox" checked={character.startingRelics.includes(relic.id)} onChange={(event) => onChange((item) => { item.character.startingRelics = event.target.checked ? [...item.character.startingRelics, relic.id] : item.character.startingRelics.filter((id) => id !== relic.id); })} /> {relic.name}</label>)}
          {project.relics.length === 0 && <p className="muted">No relics yet.</p>}
        </div>
      </div>
      <div className="subsection">
        <div className="subsection-heading"><div><h3>Character artwork</h3><p>Optional for now. Use the same project-local asset workflow as cards.</p></div><button className="secondary-button" type="button" onClick={onChooseArtwork}>{characterArt ? 'Replace image' : 'Choose image'}</button></div>
        {characterArt && <div className="asset-inline"><div className="asset-thumb" style={characterArtUrl ? { backgroundImage: 'url(' + characterArtUrl + ')' } : undefined}>{!characterArtUrl && 'Image'}</div><div><strong>{characterArt.name}</strong><small>{characterArt.relativePath}</small><button className="text-button" type="button" onClick={() => onChange((item) => { item.character.artworkAssetId = undefined; })}>Remove</button></div></div>}
      </div>
    </div>
  );
}