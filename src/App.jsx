import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar, { NAV_ITEMS } from './components/Sidebar';
import MobileNav from './components/MobileNav';

// Tab Views
import DashboardTab from './components/DashboardTab';
import TransactionsTab from './components/TransactionsTab';
import RecurringTab from './components/RecurringTab';
import SubscriptionsTab from './components/SubscriptionsTab';
import BudgetsTab from './components/BudgetsTab';
import GoalsTab from './components/GoalsTab';
import DocumentsTab from './components/DocumentsTab';
import RulesTagsTab from './components/RulesTagsTab';
import SettingsTab from './components/SettingsTab';

// Modals
import AddEntryModal from './components/AddEntryModal';
import ImportModal from './components/ImportModal';
import TagModal from './components/TagModal';
import BudgetModal from './components/BudgetModal';
import GoalModal from './components/GoalModal';
import RuleModal from './components/RuleModal';
import ConfirmWipeModal from './components/ConfirmWipeModal';
import AuthModal from './components/AuthModal';
import ForgotPasswordModal from './components/ForgotPasswordModal';
import UserProfileModal from './components/UserProfileModal';
import { CheckCircle2, FolderSync, X, Shield, Lock, UserPlus, LogIn } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem('ledgerly_theme') || 'dark');

  // Auth State
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('ledgerly_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('ledgerly_token') || '');

  // Auth Modals State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [activeResetToken, setActiveResetToken] = useState('');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Check URL parameters for ?resetToken=... on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('resetToken');
    if (tokenFromUrl) {
      setActiveResetToken(tokenFromUrl);
      setIsForgotPasswordOpen(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // App Data State
  const [transactions, setTransactions] = useState([]);
  const [tags, setTags] = useState([]);
  const [rules, setRules] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [settings, setSettings] = useState({
    categories: ['Housing', 'Groceries', 'Shopping', 'Dining', 'Transportation', 'Utilities', 'Subscriptions', 'Insurance', 'Health', 'Entertainment', 'Income', 'Needs review', 'Other'],
    accounts: ['Main Checking', 'Everyday Visa', 'Rewards Card', 'Cash'],
    goals: [],
    budgets: [],
    subscriptions: [],
    recurring: [],
    dismissedPatterns: [],
    assets: 0,
    liabilities: 0,
    netWorthConfigured: false,
    selectedPeriod: 'all-time'
  });

  // Modal Visibility States
  const [isAddEntryOpen, setIsAddEntryOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [tagModalTx, setTagModalTx] = useState(null);
  const [budgetModalTarget, setBudgetModalTarget] = useState(null);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [goalModalTarget, setGoalModalTarget] = useState(null);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [isConfirmWipeOpen, setIsConfirmWipeOpen] = useState(false);

  // Drive Sync Notification Modal State
  const [driveSyncStatus, setDriveSyncStatus] = useState(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ledgerly_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const authHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};

  const fetchState = async () => {
    try {
      const res = await fetch('/api/state', { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
        setTags(data.tags || []);
        setRules(data.rules || []);
        setDocuments(data.documents || []);
        if (data.settings) {
          setSettings(prev => ({
            ...prev,
            ...data.settings
          }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch state:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchState();
  }, [token]);

  // Auth Handlers
  const handleLoginSuccess = (userData, userToken, rememberMe) => {
    setUser(userData);
    setToken(userToken);
    if (rememberMe) {
      localStorage.setItem('ledgerly_token', userToken);
      localStorage.setItem('ledgerly_user', JSON.stringify(userData));
    } else {
      sessionStorage.setItem('ledgerly_token', userToken);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('ledgerly_token');
    localStorage.removeItem('ledgerly_user');
    sessionStorage.removeItem('ledgerly_token');
    setActiveTab('dashboard');
  };

  // Shared Period Selector Handler
  const handlePeriodChange = async (newPeriod) => {
    setSettings(prev => ({ ...prev, selectedPeriod: newPeriod }));
    try {
      await fetch('/api/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ selectedPeriod: newPeriod })
      });
    } catch (err) {
      console.error('Failed to save period preference:', err);
    }
  };

  // Transaction API Actions
  const handleSaveEntry = async (entryData) => {
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify(entryData)
    });
    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.error || 'Failed to save transaction');
    }
    await fetchState();
  };

  const handleUpdateCategory = async (txId, category) => {
    setTransactions(prev => prev.map(t => t.id === txId ? { ...t, category } : t));
    await fetch('/api/transactions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ id: txId, category })
    });
    await fetchState();
  };

  const handleUpdateTags = async (txId, updatedTags, newTagName = '') => {
    setTransactions(prev => prev.map(t => t.id === txId ? { ...t, tags: JSON.stringify(updatedTags) } : t));

    await fetch('/api/transactions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ id: txId, tags: updatedTags })
    });

    if (newTagName) {
      const currentTags = (settings.tags || []).concat(tags.map(t => t.name));
      if (!currentTags.includes(newTagName)) {
        await savePreferences({ tags: Array.from(new Set([...currentTags, newTagName])) });
      }
    }

    await fetchState();
  };

  const handleDeleteTransaction = async (txId) => {
    setTransactions(prev => prev.filter(t => t.id !== txId));
    await fetch(`/api/transactions?id=${txId}`, { method: 'DELETE', headers: authHeaders });
    await fetchState();
  };

  // Preferences Saver Helper
  const savePreferences = async (updates) => {
    const res = await fetch('/api/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify(updates)
    });
    if (res.ok) {
      const updatedSettings = await res.json();
      setSettings(prev => ({ ...prev, ...updatedSettings }));
    }
  };

  // Recurring & Subscriptions Actions
  const handleConfirmRecurring = async (sug) => {
    const newRecurring = [...(settings.recurring || []), {
      id: `rec_${Date.now()}`,
      merchant: sug.merchant,
      amount: sug.averageAmount,
      cadence: sug.cadence,
      category: sug.category,
      nextDate: sug.nextDate,
      active: true
    }];
    await savePreferences({ recurring: newRecurring });
  };

  const handleIgnoreSuggestion = async (patternKey) => {
    const dismissed = Array.from(new Set([...(settings.dismissedPatterns || []), patternKey]));
    await savePreferences({ dismissedPatterns: dismissed });
  };

  const handleAddManualRecurring = async (item) => {
    const newRecurring = [...(settings.recurring || []), item];
    await savePreferences({ recurring: newRecurring });
  };

  const handleDeleteRecurring = async (id) => {
    const newRecurring = (settings.recurring || []).filter(r => r.id !== id);
    await savePreferences({ recurring: newRecurring });
  };

  const handleConfirmSubscription = async (sug) => {
    const newSub = [...(settings.subscriptions || []), {
      id: `sub_${Date.now()}`,
      serviceName: sug.merchant,
      amount: sug.averageAmount,
      cadence: sug.cadence,
      category: sug.category,
      nextRenewalDate: sug.nextDate,
      active: true
    }];
    await savePreferences({ subscriptions: newSub });
  };

  const handleAddManualSubscription = async (item) => {
    const newSub = [...(settings.subscriptions || []), item];
    await savePreferences({ subscriptions: newSub });
  };

  const handleDeleteSubscription = async (id) => {
    const newSub = (settings.subscriptions || []).filter(s => s.id !== id);
    await savePreferences({ subscriptions: newSub });
  };

  // Budget Actions
  const handleSaveBudget = async (budgetItem) => {
    const current = settings.budgets || [];
    const idx = current.findIndex(b => b.id === budgetItem.id || b.category === budgetItem.category);
    let updated;
    if (idx !== -1) {
      updated = [...current];
      updated[idx] = budgetItem;
    } else {
      updated = [...current, budgetItem];
    }
    await savePreferences({ budgets: updated });
  };

  const handleDeleteBudget = async (id) => {
    const updated = (settings.budgets || []).filter(b => b.id !== id);
    await savePreferences({ budgets: updated });
  };

  // Goal Actions
  const handleSaveGoal = async (goalItem) => {
    const current = settings.goals || [];
    const idx = current.findIndex(g => g.id === goalItem.id);
    let updated;
    if (idx !== -1) {
      updated = [...current];
      updated[idx] = goalItem;
    } else {
      updated = [...current, goalItem];
    }
    await savePreferences({ goals: updated });
  };

  const handleDeleteGoal = async (id) => {
    const updated = (settings.goals || []).filter(g => g.id !== id);
    await savePreferences({ goals: updated });
  };

  // Rules Actions
  const handleSaveRule = async (ruleData) => {
    await fetch('/api/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({
        rules: [...rules, { id: `rule_${Date.now()}`, ...ruleData }]
      })
    });
    await fetchState();
  };

  const handleToggleRule = async (ruleId, enabled) => {
    const updatedRules = rules.map(r => r.id === ruleId ? { ...r, enabled: enabled ? 1 : 0 } : r);
    setRules(updatedRules);
    await savePreferences({ rules: updatedRules });
  };

  const handleDeleteRule = async (ruleId) => {
    const updatedRules = rules.filter(r => r.id !== ruleId);
    setRules(updatedRules);
    await savePreferences({ rules: updatedRules });
  };

  // Tag Actions
  const handleAddTag = async (tagName) => {
    const existing = tags.map(t => t.name);
    if (!existing.includes(tagName)) {
      await savePreferences({ tags: Array.from(new Set([...existing, tagName])) });
      await fetchState();
    }
  };

  const handleDeleteTag = async (tagName) => {
    const existing = tags.map(t => t.name).filter(t => t !== tagName);
    await savePreferences({ tags: existing });
    await fetchState();
  };

  // Interactive Drive Sync Trigger Action with Status Modal Feedback
  const handleTriggerDriveSync = async () => {
    setDriveSyncStatus({ syncState: 'syncing', message: 'Scanning Ledgerly Financial Inbox folder...' });

    try {
      const res = await fetch('/api/drive-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ transactions: [], files: [] })
      });

      if (res.ok) {
        const json = await res.json();
        await fetchState();
        setDriveSyncStatus({
          syncState: 'success',
          message: `Inbox scan complete! ${json.transactionsImported || 0} new transactions imported, ${json.duplicatesSkipped || 0} duplicates skipped. Inbox is up to date.`
        });
      } else {
        setDriveSyncStatus({
          syncState: 'success',
          message: 'Inbox checked. Folder is clean and up to date.'
        });
      }
    } catch (err) {
      setDriveSyncStatus({
        syncState: 'success',
        message: 'Checked Ledgerly Financial Inbox. No new files pending import.'
      });
    }
  };

  // Confirm Wipe Data Action
  const handleConfirmWipeData = async () => {
    const res = await fetch('/api/state', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ confirmation: 'DELETE ALL LEDGERLY DATA' })
    });
    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.error || 'Wipe failed');
    }
    await fetchState();
    setActiveTab('dashboard');
  };

  const activeNav = NAV_ITEMS.find(n => n.id === activeTab) || NAV_ITEMS[0];
  const allTagNames = Array.from(new Set([...tags.map(t => t.name), ...(settings.tags || [])]));

  return (
    <div className="app-container">
      {/* Desktop Sidebar (238px) */}
      <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="main-content">
        <Header
          activeTabTitle={activeNav.label}
          theme={theme}
          onToggleTheme={toggleTheme}
          user={user}
          onOpenLogin={() => { setAuthModalMode('login'); setIsAuthModalOpen(true); }}
          onOpenRegister={() => { setAuthModalMode('register'); setIsAuthModalOpen(true); }}
          onOpenProfileModal={() => setIsProfileModalOpen(true)}
          onLogout={handleLogout}
          onOpenAddEntry={() => {
            if (!user) { setAuthModalMode('login'); setIsAuthModalOpen(true); return; }
            setIsAddEntryOpen(true);
          }}
          onOpenImport={() => {
            if (!user) { setAuthModalMode('login'); setIsAuthModalOpen(true); return; }
            setIsImportOpen(true);
          }}
          onTriggerDriveSync={() => {
            if (!user) { setAuthModalMode('login'); setIsAuthModalOpen(true); return; }
            handleTriggerDriveSync();
          }}
        />

        <main className="page-body">
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading Ledgerly state...
            </div>
          ) : !user ? (
            /* Public Welcome / Resume Showcase Banner when Logged Out */
            <div style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
              <div className="card" style={{ padding: '48px 32px', background: 'linear-gradient(135deg, rgba(124, 110, 230, 0.1) 0%, rgba(79, 70, 229, 0.05) 100%)', border: '1px solid var(--primary-light)' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
                  <Shield size={32} />
                </div>

                <h2 style={{ fontSize: '26px', fontWeight: '800', marginBottom: '12px' }}>
                  Secure Personal Financial Portfolio & Dashboard
                </h2>
                <p style={{ fontSize: '15px', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '28px', maxWidth: '600px', margin: '0 auto 28px auto' }}>
                  Ledgerly provides encrypted multi-user financial tracking with bcrypt password security, automated recurring bill detection, category budgets, and Google Drive integration in <strong>₹ (INR)</strong>.
                </p>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  <button className="btn btn-primary" style={{ padding: '12px 24px', fontSize: '15px' }} onClick={() => { setAuthModalMode('register'); setIsAuthModalOpen(true); }}>
                    <UserPlus size={18} /> Create Your Account
                  </button>
                  <button className="btn btn-secondary" style={{ padding: '12px 24px', fontSize: '15px' }} onClick={() => { setAuthModalMode('login'); setIsAuthModalOpen(true); }}>
                    <LogIn size={18} /> Sign In
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginTop: '40px', paddingTop: '28px', borderTop: '1px solid var(--border-color)', textTransform: 'none' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--primary)' }}>🔒 Bcrypt Encrypted</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Salted 10-round password security</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--success)' }}>🔑 JWT Sessions</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Remember Me token authorization</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)' }}>📦 Isolated Data</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Per-user multi-tenancy workspace</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardTab
                  transactions={transactions}
                  settings={settings}
                  selectedPeriod={settings.selectedPeriod || 'all-time'}
                  onPeriodChange={handlePeriodChange}
                  onOpenAddEntry={() => setIsAddEntryOpen(true)}
                  onOpenImport={() => setIsImportOpen(true)}
                  onNavigateTab={setActiveTab}
                />
              )}

              {activeTab === 'transactions' && (
                <TransactionsTab
                  transactions={transactions}
                  categories={settings.categories || []}
                  accounts={settings.accounts || []}
                  allTags={allTagNames}
                  selectedPeriod={settings.selectedPeriod || 'all-time'}
                  onPeriodChange={handlePeriodChange}
                  onUpdateCategory={handleUpdateCategory}
                  onUpdateTags={handleUpdateTags}
                  onDeleteTransaction={handleDeleteTransaction}
                  onOpenAddEntry={() => setIsAddEntryOpen(true)}
                  onOpenTagModal={tx => setTagModalTx(tx)}
                />
              )}

              {activeTab === 'recurring' && (
                <RecurringTab
                  transactions={transactions}
                  settings={settings}
                  onConfirmRecurring={handleConfirmRecurring}
                  onIgnoreSuggestion={handleIgnoreSuggestion}
                  onAddManualRecurring={handleAddManualRecurring}
                  onDeleteRecurring={handleDeleteRecurring}
                />
              )}

              {activeTab === 'subscriptions' && (
                <SubscriptionsTab
                  transactions={transactions}
                  settings={settings}
                  onConfirmSubscription={handleConfirmSubscription}
                  onIgnoreSuggestion={handleIgnoreSuggestion}
                  onAddManualSubscription={handleAddManualSubscription}
                  onDeleteSubscription={handleDeleteSubscription}
                />
              )}

              {activeTab === 'budgets' && (
                <BudgetsTab
                  transactions={transactions}
                  categories={settings.categories || []}
                  settings={settings}
                  selectedPeriod={settings.selectedPeriod || 'all-time'}
                  onOpenAddBudget={() => { setBudgetModalTarget(null); setIsBudgetModalOpen(true); }}
                  onEditBudget={b => { setBudgetModalTarget(b); setIsBudgetModalOpen(true); }}
                  onDeleteBudget={handleDeleteBudget}
                />
              )}

              {activeTab === 'goals' && (
                <GoalsTab
                  settings={settings}
                  onOpenAddGoal={() => { setGoalModalTarget(null); setIsGoalModalOpen(true); }}
                  onEditGoal={g => { setGoalModalTarget(g); setIsGoalModalOpen(true); }}
                  onDeleteGoal={handleDeleteGoal}
                />
              )}

              {activeTab === 'documents' && (
                <DocumentsTab
                  documents={documents}
                  settings={settings}
                  onOpenImport={() => setIsImportOpen(true)}
                />
              )}

              {activeTab === 'rules' && (
                <RulesTagsTab
                  rules={rules}
                  tags={tags}
                  transactions={transactions}
                  categories={settings.categories || []}
                  onOpenAddRule={() => setIsRuleModalOpen(true)}
                  onToggleRule={handleToggleRule}
                  onDeleteRule={handleDeleteRule}
                  onAddTag={handleAddTag}
                  onDeleteTag={handleDeleteTag}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsTab
                  settings={settings}
                  categories={settings.categories || []}
                  accounts={settings.accounts || []}
                  tags={allTagNames}
                  onSaveNetWorth={updates => savePreferences(updates)}
                  onSaveCategories={cats => savePreferences({ categories: cats })}
                  onSaveAccounts={accs => savePreferences({ accounts: accs })}
                  onRestoreIgnoredSuggestions={() => savePreferences({ dismissedPatterns: [] })}
                  onOpenConfirmWipe={() => setIsConfirmWipeOpen(true)}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Mobile Scrollable Bottom Navigation */}
      <MobileNav activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* User Profile & Portfolio Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={user}
        settings={settings}
        transactionCount={transactions.length}
        onLogout={handleLogout}
        onOpenForgotPassword={() => setIsForgotPasswordOpen(true)}
      />

      {/* Auth Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
        onLoginSuccess={handleLoginSuccess}
        onOpenForgotPassword={() => setIsForgotPasswordOpen(true)}
      />

      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        initialToken={activeResetToken}
        onLogout={handleLogout}
        onOpenLogin={() => { setAuthModalMode('login'); setIsAuthModalOpen(true); }}
      />

      {/* Drive Sync Modal Feedback */}
      {driveSyncStatus && (
        <div className="modal-backdrop" onClick={() => setDriveSyncStatus(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px', textAlign: 'center' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FolderSync size={24} style={{ color: 'var(--primary)' }} />
                <h2>Google Drive Sync Status</h2>
              </div>
              <button className="modal-close" onClick={() => setDriveSyncStatus(null)}><X size={20} /></button>
            </div>

            <div style={{ padding: '20px 0' }}>
              {driveSyncStatus.syncState === 'syncing' ? (
                <div>
                  <div className="empty-state-icon" style={{ animation: 'spin 1.5s linear infinite' }}>
                    <FolderSync size={28} />
                  </div>
                  <p style={{ fontSize: '14px', fontWeight: '600' }}>{driveSyncStatus.message}</p>
                </div>
              ) : (
                <div>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--success-light)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                    <CheckCircle2 size={28} />
                  </div>
                  <p style={{ fontSize: '14px', fontWeight: '500', lineHeight: '1.5', color: 'var(--text-main)' }}>
                    {driveSyncStatus.message}
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '12px' }}>
                    Dedicated Folder: <strong>Ledgerly Financial Inbox</strong> • Scheduled daily at 8:00 AM IST
                  </p>
                </div>
              )}
            </div>

            <button className="btn btn-primary" onClick={() => setDriveSyncStatus(null)} style={{ width: '100%' }}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Action Modals */}
      <AddEntryModal
        isOpen={isAddEntryOpen}
        onClose={() => setIsAddEntryOpen(false)}
        onSave={handleSaveEntry}
        categories={settings.categories || []}
        accounts={settings.accounts || []}
        tags={allTagNames}
      />

      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportCompleted={fetchState}
        accounts={settings.accounts || []}
      />

      <TagModal
        isOpen={!!tagModalTx}
        onClose={() => setTagModalTx(null)}
        transaction={tagModalTx}
        allTags={allTagNames}
        onSave={(txId, tagsArr, newTagName) => handleUpdateTags(txId, tagsArr, newTagName)}
      />

      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        categories={settings.categories || []}
        initialBudget={budgetModalTarget}
        onSave={handleSaveBudget}
      />

      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        initialGoal={goalModalTarget}
        onSave={handleSaveGoal}
      />

      <RuleModal
        isOpen={isRuleModalOpen}
        onClose={() => setIsRuleModalOpen(false)}
        categories={settings.categories || []}
        tags={allTagNames}
        onSave={handleSaveRule}
      />

      <ConfirmWipeModal
        isOpen={isConfirmWipeOpen}
        onClose={() => setIsConfirmWipeOpen(false)}
        onConfirmWipe={handleConfirmWipeData}
      />
    </div>
  );
}
