import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const R2_DIR = path.join(__dirname, '..', 'storage', 'r2');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(R2_DIR)) {
  fs.mkdirSync(R2_DIR, { recursive: true });
}

// Starter configurations (Lookup definitions only, zero financial records)
const STARTER_CATEGORIES = [
  'Housing', 'Groceries', 'Shopping', 'Dining', 'Transportation',
  'Utilities', 'Subscriptions', 'Insurance', 'Health', 'Entertainment',
  'Income', 'Needs review', 'Other'
];

const STARTER_ACCOUNTS = [
  'Main Checking', 'Everyday Visa', 'Rewards Card', 'Cash'
];

const getInitialUserSettings = () => ({
  categories: STARTER_CATEGORIES,
  accounts: STARTER_ACCOUNTS,
  goals: [],
  budgets: [],
  subscriptions: [],
  recurring: [],
  dismissedPatterns: [],
  assets: 0,
  liabilities: 0,
  netWorthConfigured: false,
  selectedPeriod: 'all-time',
  driveFolder: {
    name: 'Ledgerly Financial Inbox',
    id: 'folder-ledgerly-inbox-01',
    url: 'https://drive.google.com/drive/folders/ledgerly-inbox'
  },
  driveSync: {
    schedule: '08:00 AM Daily',
    timezone: 'Asia/Kolkata',
    lastSyncedAt: null,
    lastStatus: 'idle',
    lastImportedCount: 0,
    lastDuplicateCount: 0,
    lastReviewCount: 0,
    errors: []
  },
  processedDriveFileIds: [],
  driveResetAt: null,
  freshStart: true
});

const getInitialDb = () => ({
  users: [],
  transactions: [],
  tags: [],
  rules: [],
  documents: [],
  settings: getInitialUserSettings(),
  userSettings: {} // userId -> settings object
});

let memoryDb = null;

function loadDb() {
  if (memoryDb) return memoryDb;
  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      memoryDb = JSON.parse(raw);
      if (!memoryDb.users) memoryDb.users = [];
      if (!memoryDb.userSettings) memoryDb.userSettings = {};
    } catch (e) {
      console.error('Failed to parse database file, reinitializing', e);
      memoryDb = getInitialDb();
      saveDb();
    }
  } else {
    memoryDb = getInitialDb();
    saveDb();
  }
  return memoryDb;
}

function saveDb() {
  if (!memoryDb) return;
  fs.writeFileSync(DB_FILE, JSON.stringify(memoryDb, null, 2), 'utf-8');
}

export function generateFingerprint(date, merchant, amount, account) {
  const normMerchant = (merchant || '').toString().trim().toLowerCase();
  const normAmount = Number(amount || 0).toFixed(2);
  const normAccount = (account || '').toString().trim().toLowerCase();
  const normDate = (date || '').toString().trim();
  return `${normDate}|${normMerchant}|${normAmount}|${normAccount}`;
}

export const dbEngine = {
  // User Authentication
  createUser({ name, email, password }) {
    const db = loadDb();
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !password) {
      throw new Error('Email and password are required');
    }

    const existing = db.users.find(u => u.email === cleanEmail);
    if (existing) {
      throw new Error('An account with this email already exists');
    }

    const userId = `usr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const passwordHash = bcrypt.hashSync(password, 10);

    const newUser = {
      id: userId,
      name: (name || cleanEmail.split('@')[0]).trim(),
      email: cleanEmail,
      passwordHash,
      createdAt: new Date().toISOString(),
      resetToken: null,
      resetTokenExpiry: null
    };

    db.users.push(newUser);
    // Initialize clean, isolated user settings for this user ONLY
    db.userSettings[userId] = getInitialUserSettings();
    saveDb();

    return {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      createdAt: newUser.createdAt
    };
  },

  verifyUserCredentials({ email, password }) {
    const db = loadDb();
    const cleanEmail = (email || '').trim().toLowerCase();
    const user = db.users.find(u => u.email === cleanEmail);
    if (!user) return null;

    const isValid = bcrypt.compareSync(password, user.passwordHash);
    if (!isValid) return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt
    };
  },

  getUserByEmail(email) {
    const db = loadDb();
    const cleanEmail = (email || '').trim().toLowerCase();
    return db.users.find(u => u.email === cleanEmail) || null;
  },

  getUserById(userId) {
    const db = loadDb();
    const user = db.users.find(u => u.id === userId);
    if (!user) return null;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      hasMpin: !!user.mpinHash,
      hasBiometrics: !!user.webauthnCredentialId,
      createdAt: user.createdAt
    };
  },

  setUserMpin({ userId, mpin }) {
    const db = loadDb();
    const user = db.users.find(u => u.id === userId);
    if (!user) throw new Error('User not found');

    if (!/^\d{4}$/.test(mpin)) {
      throw new Error('MPIN must be exactly 4 digits');
    }

    user.mpinHash = bcrypt.hashSync(mpin, 10);
    saveDb();
    return true;
  },

  verifyUserMpin({ email, mpin }) {
    const db = loadDb();
    const cleanEmail = (email || '').trim().toLowerCase();
    const user = db.users.find(u => u.email === cleanEmail);
    if (!user || !user.mpinHash) return null;

    const isValid = bcrypt.compareSync(mpin, user.mpinHash);
    if (!isValid) return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt
    };
  },

  registerWebAuthnCredential({ userId, credentialId, publicKey }) {
    const db = loadDb();
    const user = db.users.find(u => u.id === userId);
    if (!user) throw new Error('User not found');

    user.webauthnCredentialId = credentialId;
    user.webauthnPublicKey = publicKey;
    saveDb();
    return true;
  },

  verifyWebAuthnCredential({ credentialId }) {
    const db = loadDb();
    const user = db.users.find(u => u.webauthnCredentialId === credentialId);
    if (!user) return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt
    };
  },

  createPasswordResetToken(email) {
    const db = loadDb();
    const cleanEmail = (email || '').trim().toLowerCase();
    const user = db.users.find(u => u.email === cleanEmail);
    if (!user) {
      throw new Error('No user account found with this email');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour expiration

    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    saveDb();

    return { resetToken, email: user.email };
  },

  resetPassword({ resetToken, newPassword }) {
    const db = loadDb();
    const user = db.users.find(u => u.resetToken === resetToken && u.resetTokenExpiry > Date.now());
    if (!user) {
      throw new Error('Invalid or expired password reset token');
    }

    user.passwordHash = bcrypt.hashSync(newPassword, 10);
    user.resetToken = null;
    user.resetTokenExpiry = null;
    saveDb();

    return { success: true, email: user.email };
  },

  // State API strictly scoped by userId ONLY (No data bleed between users)
  getState(userId) {
    const db = loadDb();
    if (!userId) {
      return {
        transactions: [],
        tags: [],
        rules: [],
        documents: [],
        settings: getInitialUserSettings()
      };
    }

    // STRICT MULTI-TENANT FILTERING BY USER ID
    const userTx = (db.transactions || []).filter(t => t.userId === userId);
    const userRules = (db.rules || []).filter(r => r.userId === userId);
    const userTags = (db.tags || []).filter(t => t.userId === userId);
    const userDocs = (db.documents || []).filter(d => d.userId === userId);

    const sortedTx = [...userTx].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).slice(0, 5000);
    const sortedDocs = [...userDocs].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 100);

    const settings = db.userSettings[userId] || getInitialUserSettings();

    return {
      transactions: sortedTx,
      tags: userTags,
      rules: userRules,
      settings,
      documents: sortedDocs
    };
  },

  // Transactions
  addTransactions(userId, rawBatch, options = {}) {
    const db = loadDb();
    if (!userId) throw new Error('User ID required');

    const batch = Array.isArray(rawBatch) ? rawBatch : [rawBatch];

    let insertedCount = 0;
    let duplicateCount = 0;
    const insertedRows = [];
    const duplicates = [];

    const userRules = (db.rules || []).filter(r => r.userId === userId);

    for (const item of batch) {
      const date = item.date || new Date().toISOString().split('T')[0];
      const merchant = (item.merchant || '').trim();
      const amount = Math.abs(parseFloat(item.amount) || 0);
      const type = item.type === 'income' ? 'income' : 'expense';
      const account = (item.account || 'Imported account').trim();

      if (!merchant || isNaN(amount) || amount <= 0) {
        continue;
      }

      const fp = generateFingerprint(date, merchant, amount, account);

      // Check for duplicate fingerprint within THIS user's transactions
      const existing = (db.transactions || []).find(t => t.fingerprint === fp && t.userId === userId);
      if (existing) {
        duplicateCount++;
        duplicates.push(existing);
        continue;
      }

      // Check rules if enabled
      let category = item.category || 'Needs review';
      let tagsArray = Array.isArray(item.tags) ? item.tags : [];

      for (const rule of userRules) {
        if (rule.enabled && rule.pattern && merchant.toLowerCase().includes(rule.pattern.toLowerCase())) {
          category = rule.category;
          if (rule.tag && !tagsArray.includes(rule.tag)) {
            tagsArray.push(rule.tag);
          }
          break;
        }
      }

      const newTx = {
        id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        date,
        merchant,
        category,
        amount,
        type,
        account,
        tags: JSON.stringify(tagsArray),
        receipt: item.receipt ? 1 : 0,
        source: item.source || 'manual',
        fingerprint: fp,
        createdAt: new Date().toISOString()
      };

      db.transactions.push(newTx);
      insertedCount++;
      insertedRows.push(newTx);
    }

    saveDb();

    return {
      insertedCount,
      duplicateCount,
      insertedRows,
      duplicates
    };
  },

  updateTransaction(userId, id, updates) {
    const db = loadDb();
    if (!userId) throw new Error('User ID required');

    const tx = db.transactions.find(t => t.id === id && t.userId === userId);
    if (!tx) throw new Error('Transaction not found');

    if (updates.category !== undefined) tx.category = updates.category;
    if (updates.tags !== undefined) {
      tx.tags = Array.isArray(updates.tags) ? JSON.stringify(updates.tags) : updates.tags;
    }
    if (updates.merchant !== undefined) tx.merchant = updates.merchant;
    if (updates.amount !== undefined) tx.amount = Math.abs(parseFloat(updates.amount) || tx.amount);
    if (updates.type !== undefined) tx.type = updates.type;
    if (updates.date !== undefined) tx.date = updates.date;
    if (updates.account !== undefined) tx.account = updates.account;

    // Recalculate fingerprint
    tx.fingerprint = generateFingerprint(tx.date, tx.merchant, tx.amount, tx.account);

    saveDb();
    return tx;
  },

  deleteTransaction(userId, id) {
    const db = loadDb();
    if (!userId) throw new Error('User ID required');

    const initialLen = db.transactions.length;
    db.transactions = db.transactions.filter(t => !(t.id === id && t.userId === userId));

    if (db.transactions.length !== initialLen) {
      saveDb();
      return true;
    }
    return false;
  },

  // User Settings & Preferences Scoped strictly by userId
  saveUserSettings(userId, updates) {
    const db = loadDb();
    if (!userId) throw new Error('User ID required');

    db.userSettings[userId] = {
      ...(db.userSettings[userId] || getInitialUserSettings()),
      ...updates,
      updatedAt: new Date().toISOString()
    };

    saveDb();
    return db.userSettings[userId];
  },

  // Completely wipe data for a single user ONLY
  wipeAllData(userId) {
    const db = loadDb();
    if (!userId) throw new Error('User ID required');

    db.transactions = db.transactions.filter(t => t.userId !== userId);
    db.rules = db.rules.filter(r => r.userId !== userId);
    db.tags = db.tags.filter(t => t.userId !== userId);
    db.documents = db.documents.filter(d => d.userId !== userId);
    db.userSettings[userId] = getInitialUserSettings();

    saveDb();
    return true;
  }
};
