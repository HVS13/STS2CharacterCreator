import type { Card, Project } from '../types';
import { CardEditor } from './CardEditor';
import { EmptyState } from './Field';

export function CardCollectionEditor({ cards, project, selectedId, artworkPreviews, onSelect, onChange, onDelete, onDuplicate, onChooseArtwork, onAdd }: {
  cards: Card[];
  project: Project;
  selectedId: string | null;
  artworkPreviews: Record<string, string>;
  onSelect: (id: string) => void;
  onChange: (updater: (card: Card) => void) => void;
  onDelete: (card: Card) => void;
  onDuplicate: (card: Card) => void;
  onChooseArtwork: (card: Card) => void;
  onAdd: () => void;
}) {
  const selected = cards.find((card) => card.id === selectedId) ?? cards[0];
  return (
    <div className="collection-editor card-collection">
      <section className="collection-list" aria-label="Cards">
        <div className="collection-toolbar"><strong>Cards</strong><button className="secondary-button" type="button" onClick={onAdd}>Add card</button></div>
        <div className="collection-items">{cards.map((card) => <button type="button" className={'collection-item' + (selected?.id === card.id ? ' selected' : '')} key={card.id} onClick={() => onSelect(card.id)}><span><strong>{card.name || 'Unnamed card'}</strong><small>{card.type} · {card.cost} energy · {card.rarity}</small></span></button>)}{cards.length === 0 && <EmptyState title="No cards yet" text="Create your first card to start building the character's deck." action={<button className="secondary-button" type="button" onClick={onAdd}>Create card</button>} />}</div>
      </section>
      <section className="detail-panel">{selected ? <CardEditor card={selected} project={project} artworkPreviews={artworkPreviews} onChange={(updater) => onChange(updater)} onDelete={() => onDelete(selected)} onDuplicate={() => onDuplicate(selected)} onChooseArtwork={() => onChooseArtwork(selected)} /> : <EmptyState title="Select a card" text="Choose a card from the list or add the first one." />}</section>
    </div>
  );
}