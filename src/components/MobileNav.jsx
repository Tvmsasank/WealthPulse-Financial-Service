import React, { useState } from 'react';
import {
  Home,
  LayoutDashboard,
  CreditCard,
  TrendingUp,
  MoreHorizontal,
  RefreshCw,
  Calendar,
  PieChart,
  Target,
  FileText,
  Sliders,
  Settings,
  Calculator,
  X,
  User,
  LogOut
} from 'lucide-react';

const MAIN_TABS = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'investments', label: 'Investments', icon: TrendingUp },
  { id: 'transactions', label: 'Transactions', icon: CreditCard }
];

const MORE_TABS = [
  { id: 'calculators', label: 'SIP & EPF Calculators', icon: Calculator },
  { id: 'recurring', label: 'Recurring Bills', icon: RefreshCw },
  { id: 'subscriptions', label: 'Subscriptions', icon: Calendar },
  { id: 'budgets', label: 'Budgets & Limits', icon: PieChart },
  { id: 'goals', label: 'Savings Goals', icon: Target },
  { id: 'documents', label: 'Document Inbox', icon: FileText },
  { id: 'rules', label: 'Rules & Tags', icon: Sliders },
  { id: 'settings', label: 'Settings & Security', icon: Settings }
];

export default function MobileNav({ activeTab, onSelectTab, user, onOpenProfile, onLogout }) {
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const handleTabClick = (tabId) => {
    onSelectTab(tabId);
    setIsMoreOpen(false);
  };

  const isMoreActive = MORE_TABS.some(t => t.id === activeTab);

  return (
    <>
      {/* 5-Item Clean Bottom Bar */}
      <nav className="mobile-nav">
        <div className="mobile-nav-inner">
          {MAIN_TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={`mobile-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => handleTabClick(tab.id)}
              >
                <Icon size={20} />
                <span>{tab.label}</span>
              </button>
            );
          })}

          {/* More Menu Toggle */}
          <button
            type="button"
            className={`mobile-nav-item ${isMoreActive || isMoreOpen ? 'active' : ''}`}
            onClick={() => setIsMoreOpen(!isMoreOpen)}
          >
            <MoreHorizontal size={20} />
            <span>More</span>
          </button>
        </div>
      </nav>

      {/* "More" Slide-up Drawer Bottom Sheet */}
      {isMoreOpen && (
        <div className="modal-backdrop" onClick={() => setIsMoreOpen(false)} style={{ zIndex: 999, alignItems: 'flex-end', padding: 0 }}>
          <div
            className="mobile-more-sheet"
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              background: 'var(--bg-card)',
              backdropFilter: 'blur(30px) saturate(190%)',
              WebkitBackdropFilter: 'blur(30px) saturate(190%)',
              borderTop: '1px solid var(--border-glass)',
              borderTopLeftRadius: '24px',
              borderTopRightRadius: '24px',
              padding: '20px 20px 36px 20px',
              boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.5)',
              animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {/* Drawer Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '4px', background: 'var(--text-muted)', borderRadius: '2px', margin: '0 auto 12px auto' }}></div>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setIsMoreOpen(false)}
                style={{ padding: '6px', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: 'var(--text-main)' }}>
              All Features & Settings
            </h3>

            {/* Grid of Remaining Features */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '20px' }}>
              {MORE_TABS.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleTabClick(tab.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      background: isActive ? 'var(--primary-light)' : 'rgba(255, 255, 255, 0.04)',
                      border: `1px solid ${isActive ? 'var(--primary)' : 'var(--border-color)'}`,
                      color: isActive ? 'var(--primary)' : 'var(--text-main)',
                      fontSize: '13px',
                      fontWeight: '600',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Icon size={18} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* User Session Row */}
            {user && (
              <div style={{ display: 'flex', gap: '10px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                {onOpenProfile && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1, fontSize: '13px', padding: '10px' }}
                    onClick={() => { setIsMoreOpen(false); onOpenProfile(); }}
                  >
                    <User size={16} /> My Account
                  </button>
                )}
                {onLogout && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1, fontSize: '13px', padding: '10px', color: 'var(--danger)' }}
                    onClick={() => { setIsMoreOpen(false); onLogout(); }}
                  >
                    <LogOut size={16} /> Sign Out
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
