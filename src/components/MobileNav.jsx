import React from 'react';
import { NAV_ITEMS } from './Sidebar';

export default function MobileNav({ activeTab, onSelectTab }) {
  const getMobileLabel = (item) => {
    if (item.id === 'subscriptions') return 'Subscripts';
    if (item.id === 'rules') return 'Rules';
    return item.label;
  };

  return (
    <div className="mobile-nav">
      <div className="mobile-nav-inner">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`mobile-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onSelectTab(item.id)}
              title={item.label}
            >
              <Icon size={18} />
              <span>{getMobileLabel(item)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
