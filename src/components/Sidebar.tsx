import type { SectionId } from '../types';

interface SidebarProps {
  selected: SectionId;
  onSelect: (section: SectionId) => void;
  issueCount: number;
}

const groups: Array<{ label: string; items: Array<[SectionId, string]> }> = [
  { label: 'Build', items: [['character', 'Character'], ['cards', 'Cards']] },
  { label: 'Items', items: [['relics', 'Relics'], ['potions', 'Potions'], ['enchantments', 'Enchantments']] },
  { label: 'Mechanics', items: [['statuses', 'Statuses'], ['stances', 'Stances'], ['orbs', 'Orbs'], ['companions', 'Companions']] },
  { label: 'Presentation', items: [['artwork', 'Artwork'], ['lore', 'Dialogue & Lore'], ['localization', 'Localization']] },
];

export function Sidebar({ selected, onSelect, issueCount }: SidebarProps) {
  return (
    <aside className="sidebar" aria-label="Project sections">
      <div className="brand-mark" aria-label="STS2 Character Creator">
        <span className="brand-symbol">S</span>
        <span><strong>Character Creator</strong><small>Local project editor</small></span>
      </div>
      <nav>
        {groups.map((group) => (
          <div className="nav-group" key={group.label}>
            <div className="nav-group-label">{group.label}</div>
            {group.items.map(([id, label]) => (
              <button className={'nav-item' + (selected === id ? ' selected' : '')} type="button" key={id} onClick={() => onSelect(id)} aria-current={selected === id ? 'page' : undefined}>
                <span>{label}</span>
                {id === 'cards' && <span className="nav-count">{issueCount > 0 ? issueCount : ''}</span>}
              </button>
            ))}
          </div>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <button className={'nav-item' + (selected === 'settings' ? ' selected' : '')} type="button" onClick={() => onSelect('settings')} aria-current={selected === 'settings' ? 'page' : undefined}>Settings</button>
        {issueCount > 0 && <div className="sidebar-warning" role="status">{issueCount} validation issue{issueCount === 1 ? '' : 's'}</div>}
      </div>
    </aside>
  );
}