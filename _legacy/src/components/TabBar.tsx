import { Home, Target, TrendingUp, Beaker, Settings } from 'lucide-react';
import type { TabId } from '../types';

type TabBarProps = {
  currentTab: TabId;
  onTabChange: (tab: TabId) => void;
  hidden?: boolean;
};

const TABS: Array<{ id: TabId; icon: typeof Home; label: string }> = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'train', icon: Target, label: 'Train' },
  { id: 'progress', icon: TrendingUp, label: 'Progress' },
  { id: 'science', icon: Beaker, label: 'Science' },
  { id: 'settings', icon: Settings, label: 'Settings' },
];

export function TabBar({ currentTab, onTabChange, hidden = false }: TabBarProps) {
  if (hidden) return null;

  return (
    <nav className="tab-bar" aria-label="Main navigation">
      {TABS.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          type="button"
          className={`tab ${currentTab === id ? 'tab--active' : ''}`}
          onClick={() => onTabChange(id)}
          aria-current={currentTab === id ? 'page' : undefined}
        >
          <Icon size={22} className="tab__icon" />
          <span className="tab__label">{label}</span>
        </button>
      ))}
    </nav>
  );
}
