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
    // Initialize user settings with default or legacy state
    db.userSettings[userId] = getInitialUserSettings();
    saveDb();

    // Migrate any existing unassigned legacy data to this newly created account
    this.migrateLegacyDataToUser(userId);

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

  getUserById(userId) {
    const db = loadDb();
    const user = db.users.find(u => u.id === userId);
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

  // Legacy Data Migration: Transfer all unassigned transactions, settings, and documents to newly created account
  migrateLegacyDataToUser(userId) {
    const db = loadDb();

    // 1. Assign transactions
    for (const t of db.transactions) {
      if (!t.userId) {
        t.userId = userId;
      }
    }

    // 2. Assign rules & tags
    for (const r of db.rules) {
      if (!r.userId) {
        r.userId = userId;
      }
    }
    for (const tag of db.tags) {
      if (!tag.userId) {
        tag.userId = userId;
      }
    }

    // 3. Assign documents
    for (const d of db.documents) {
      if (!d.userId) {
        d.userId = userId;
      }
    }

    // 4. Migrate legacy settings to userSettings[userId]
    if (db.settings && (db.settings.assets > 0 || db.settings.netWorthConfigured || (db.settings.goals && db.settings.goals.length > 0) || (db.settings.budgets && db.settings.budgets.length > 0))) {
      db.userSettings[userId] = {
        ...db.userSettings[userId],
        ...db.settings
      };
    }

    saveDb();
  },

  // State API scoped by userId
  getState(userId) {
    const db = loadDb();
    
    // Filter by userId or return unassigned if no user specified
    const userTx = db.transactions.filter(t => !userId || t.userId === userId || !t.userId);
    const userRules = db.rules.filter(r => !userId || r.userId === userId || !r.userId);
    const userTags = db.tags.filter(t => !userId || t.userId === userId || !t.userId);
    const userDocs = db.documents.filter(d => !userId || d.userId === userId || !d.userId);

    const sortedTx = [...userTx].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).slice(0, 5000);
    const sortedDocs = [...userDocs].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 100);

    const settings = (userId && db.userSettings[userId]) || db.settings || getInitialUserSettings();

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
    const batch = Array.isArray(rawBatch) ? rawBatch : [rawBatch];

    let insertedCount = 0;
    let duplicateCount = 0;
    const insertedRows = [];
    const duplicates = [];

    const userRules = db.rules.filter(r => !userId || r.userId === userId || !r.userId);

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

      // Check for duplicate fingerprint within user's transactions
      const existing = db.transactions.find(t => t.fingerprint === fp && (!userId || t.userId === userId || !t.userId));
      if (existing) {
        duplicateCount++;
        duplicates.push(existing);
        continue;
      }

      // Check rules if enabled
      let category = item.category || 'Needs review';
      let tagsArray = Array.isArray(item.tags) ? item.tags : [];

      if (userRules.length > 0) {
        for (const rule of userRules) {
          if (!rule.enabled) continue;
          const whenLower = (rule.whenText || rule.merchantPattern || '').toLowerCase().trim();
          if (whenLower && merchant.toLowerCase().includes(whenLower)) {
            if (rule.thenCategory || rule.category) category = rule.thenCategory || rule.category;
            const tagVal = rule.thenTag || rule.tag;
            if (tagVal && !tagsArray.includes(tagVal)) {
              tagsArray.push(tagVal);
            }
          }
        }
      }

      // Deduplicate tags
      tagsArray = Array.from(new Set(tagsArray.map(t => t.trim()).filter(Boolean)));

      const newTx = {
        id: item.id || `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: userId || null,
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
        createdAt: item.createdAt || new Date().toISOString()
      };

      db.transactions.unshift(newTx);
      insertedRows.push(newTx);
      insertedCount++;
    }

    saveDb();
    return { insertedCount, duplicateCount, insertedRows, duplicates };
  },

  updateTransaction(userId, id, updates) {
    const db = loadDb();
    const idx = db.transactions.findIndex(t => t.id === id && (!userId || t.userId === userId || !t.userId));
    if (idx === -1) return null;

    const tx = db.transactions[idx];

    if (updates.category !== undefined) {
      tx.category = updates.category;
    }
    if (updates.tags !== undefined) {
      const arr = Array.isArray(updates.tags) ? updates.tags : JSON.parse(updates.tags || '[]');
      tx.tags = JSON.stringify(Array.from(new Set(arr.map(t => t.trim()).filter(Boolean))));
    }

    saveDb();
    return tx;
  },

  deleteTransaction(userId, id) {
    const db = loadDb();
    const idx = db.transactions.findIndex(t => t.id === id && (!userId || t.userId === userId || !t.userId));
    if (idx === -1) return false;
    db.transactions.splice(idx, 1);
    saveDb();
    return true;
  },

  // Preferences
  updatePreferences(userId, updates) {
    const db = loadDb();
    const currentSettings = (userId && db.userSettings[userId]) || db.settings || getInitialUserSettings();

    const updatedSettings = {
      ...currentSettings,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    if (userId) {
      db.userSettings[userId] = updatedSettings;
    } else {
      db.settings = updatedSettings;
    }

    // Sync tags if provided
    if (updates.tags && Array.isArray(updates.tags)) {
      const existingNames = new Set(db.tags.map(t => t.name));
      for (const tagName of updates.tags) {
        if (!existingNames.has(tagName)) {
          db.tags.push({ id: `tag_${Date.now()}`, userId: userId || null, name: tagName, createdAt: new Date().toISOString() });
        }
      }
    }

    saveDb();
    return updatedSettings;
  },

  // Tags
  addTag(userId, tagName) {
    const db = loadDb();
    const name = tagName.trim();
    if (!name) return null;
    let existing = db.tags.find(t => t.name.toLowerCase() === name.toLowerCase() && (!userId || t.userId === userId || !t.userId));
    if (!existing) {
      existing = { id: `tag_${Date.now()}`, userId: userId || null, name, createdAt: new Date().toISOString() };
      db.tags.push(existing);
      saveDb();
    }
    return existing;
  },

  deleteTag(userId, tagName) {
    const db = loadDb();
    const idx = db.tags.findIndex(t => t.name.toLowerCase() === tagName.toLowerCase() && (!userId || t.userId === userId || !t.userId));
    if (idx !== -1) {
      db.tags.splice(idx, 1);
      saveDb();
      return true;
    }
    return false;
  },

  // Rules
  addRule(userId, rule) {
    const db = loadDb();
    const newRule = {
      id: rule.id || `rule_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      userId: userId || null,
      whenText: rule.whenText || rule.merchantPattern || '',
      merchantPattern: rule.merchantPattern || rule.whenText || '',
      thenText: rule.thenText || '',
      thenCategory: rule.thenCategory || rule.category || '',
      category: rule.category || rule.thenCategory || '',
      thenTag: rule.thenTag || rule.tag || '',
      tag: rule.tag || rule.thenTag || '',
      enabled: rule.enabled !== undefined ? (rule.enabled ? 1 : 0) : 1,
      createdAt: new Date().toISOString()
    };
    db.rules.push(newRule);
    saveDb();
    return newRule;
  },

  updateRule(userId, id, updates) {
    const db = loadDb();
    const rule = db.rules.find(r => r.id === id && (!userId || r.userId === userId || !r.userId));
    if (!rule) return null;
    if (updates.enabled !== undefined) rule.enabled = updates.enabled ? 1 : 0;
    if (updates.whenText !== undefined) rule.whenText = updates.whenText;
    if (updates.merchantPattern !== undefined) rule.merchantPattern = updates.merchantPattern;
    if (updates.thenText !== undefined) rule.thenText = updates.thenText;
    saveDb();
    return rule;
  },

  deleteRule(userId, id) {
    const db = loadDb();
    const idx = db.rules.findIndex(r => r.id === id && (!userId || r.userId === userId || !r.userId));
    if (idx !== -1) {
      db.rules.splice(idx, 1);
      saveDb();
      return true;
    }
    return false;
  },

  // R2 / Documents
  saveDocument(userId, fileObj, source = 'upload') {
    const db = loadDb();
    const id = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    const safeFilename = (fileObj.filename || fileObj.originalname || 'document').replace(/[^a-zA-Z0-9._-]/g, '_');
    const prefix = source === 'google-drive' ? 'drive-inbox' : 'uploads';
    const objectKey = `${prefix}/${id}-${safeFilename}`;

    // Write file bytes to R2 local directory
    const fullPath = path.join(R2_DIR, objectKey);
    const parentDir = path.dirname(fullPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    if (fileObj.buffer) {
      fs.writeFileSync(fullPath, fileObj.buffer);
    } else if (fileObj.base64Content) {
      fs.writeFileSync(fullPath, Buffer.from(fileObj.base64Content, 'base64'));
    } else if (fileObj.path) {
      fs.copyFileSync(fileObj.path, fullPath);
    } else {
      fs.writeFileSync(fullPath, Buffer.from(fileObj.content || ''));
    }

    const newDoc = {
      id,
      userId: userId || null,
      filename: fileObj.filename || fileObj.originalname || safeFilename,
      mimeType: fileObj.mimeType || fileObj.mimetype || 'application/octet-stream',
      size: fileObj.size || 0,
      objectKey,
      status: fileObj.status || 'stored',
      source,
      createdAt: new Date().toISOString()
    };

    db.documents.unshift(newDoc);
    saveDb();
    return newDoc;
  },

  // Complete Data Wipe
  wipeAllData(userId) {
    const db = loadDb();

    if (userId) {
      db.transactions = db.transactions.filter(t => t.userId !== userId);
      db.rules = db.rules.filter(r => r.userId !== userId);
      db.tags = db.tags.filter(t => t.userId !== userId);
      db.documents = db.documents.filter(d => d.userId !== userId);
      db.userSettings[userId] = getInitialUserSettings();
    } else {
      memoryDb = getInitialDb();
    }

    saveDb();
    return true;
  }
};
