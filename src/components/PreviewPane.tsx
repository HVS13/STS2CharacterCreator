import type { Card, Project, SectionId } from '../types';
import { cardDescription } from '../lib/runtimeAdapter';
import { Badge } from './Field';

interface PreviewPaneProps {
  project: Project;
  section: SectionId;
  selectedCard?: Card;
  artworkPreviews: Record<string, string>;
}

export function PreviewPane({ project, section, selectedCard, artworkPreviews }: PreviewPaneProps) {
  const artwork = selectedCard?.artworkAssetId ? project.presentation.artwork.find((item) => item.id === selectedCard.artworkAssetId) : undefined;
  const artworkUrl = artwork ? artworkPreviews[artwork.id] : undefined;
  return (
    <aside className="preview-pane" aria-label="Contextual preview">
      <div className="pane-heading"><span>Preview</span><Badge>{section === 'cards' ? 'Card' : section === 'character' ? 'Character' : 'Project'}</Badge></div>
      {selectedCard ? (
        <div className="card-preview">
          <div className="card-art" style={artworkUrl ? { backgroundImage: 'url(' + artworkUrl + ')' } : undefined}>
            {!artworkUrl && <span aria-hidden="true">✦</span>}
          </div>
          <div className="card-preview-type">{selectedCard.type} · {selectedCard.rarity}</div>
          <h3>{selectedCard.name || 'Unnamed card'}</h3>
          <div className="card-cost">{selectedCard.cost}</div>
          <p>{cardDescription(selectedCard, project)}</p>
          {selectedCard.upgrade && <p className="preview-upgrade">Upgrade: {cardDescription(selectedCard, project, true)}</p>}
          {selectedCard.tags.length > 0 && <div className="tag-row">{selectedCard.tags.map((tag) => <Badge key={tag}>{tag}</Badge>)}</div>}
        </div>
      ) : section === 'character' ? (
        <div className="character-preview">
          <div className="character-avatar">{project.character.name.slice(0, 1).toUpperCase() || '?'}</div>
          <h3>{project.character.name || 'Unnamed character'}</h3>
          <p>{project.character.description || 'Add a short character description.'}</p>
          <dl className="stat-list">
            <div><dt>Max HP</dt><dd>{project.character.maxHp}</dd></div>
            <div><dt>Energy</dt><dd>{project.character.maxEnergy}</dd></div>
            <div><dt>Starting gold</dt><dd>{project.character.startingGold}</dd></div>
            <div><dt>Cards</dt><dd>{project.cards.length}</dd></div>
          </dl>
        </div>
      ) : (
        <div className="project-preview">
          <div className="preview-icon" aria-hidden="true">S</div>
          <h3>{project.name || 'Untitled project'}</h3>
          <p>{project.description || 'Add a project description in Settings.'}</p>
          <dl className="stat-list">
            <div><dt>Cards</dt><dd>{project.cards.length}</dd></div>
            <div><dt>Relics</dt><dd>{project.relics.length}</dd></div>
            <div><dt>Status effects</dt><dd>{project.mechanics.statuses.length}</dd></div>
            <div><dt>Artwork</dt><dd>{project.presentation.artwork.length}</dd></div>
          </dl>
        </div>
      )}
    </aside>
  );
}