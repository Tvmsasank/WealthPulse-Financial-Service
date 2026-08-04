import React from 'react';
import { NAV_ITEMS } from './Sidebar';

export default function MobileNav({ activeTab, onSelectTab }) {
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
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
