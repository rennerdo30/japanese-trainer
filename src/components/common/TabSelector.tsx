'use client';

import { memo } from 'react';
import styles from './TabSelector.module.css';

export interface Tab {
  id: string;
  label: string;
  badge?: number | string;
}

interface TabSelectorProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const TabSelector = memo(function TabSelector({
  tabs,
  activeTab,
  onTabChange,
}: TabSelectorProps) {
  return (
    <div className={styles.tabContainer} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
          {tab.badge !== undefined && (
            <span className={styles.tabBadge}>{tab.badge}</span>
          )}
        </button>
      ))}
    </div>
  );
});

export default TabSelector;
