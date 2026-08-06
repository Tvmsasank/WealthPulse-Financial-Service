import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  TrendingUp,
  RefreshCw,
  CreditCard,
  PieChart,
  Target,
  FileText,
  Sliders,
  Settings,
  ShieldCheck
} from 'lucide-react';

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'transactions', label: 'Transactions', icon: Receipt },
  { id: 'investments', label: 'Investments', icon: TrendingUp },
  { id: 'recurring', label: 'Recurring', icon: RefreshCw },
  { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
  { id: 'budgets', label: 'Budgets', icon: PieChart },
  { id: 'goals', label: 'Goals', icon: Target },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'rules', label: 'Rules & Tags', icon: Sliders },
  { id: 'settings', label: 'Settings', icon: Settings }
];

export default function Sidebar({ activeTab, onSelectTab }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <button
          type="button"
          className="sidebar-logo"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, width: '100%', textAlign: 'left' }}
          onClick={() => onSelectTab('dashboard')}
          title="Go to Dashboard"
        >
          <ShieldCheck size={28} />
          <span>Ledgerly</span>
        </button>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onSelectTab('dashboard' === item.id ? 'dashboard' : item.id)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
