import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

const getInitialDb = () => ({
  transactions: [],
  tags: [],
  rules: [],
  documents: [],
  settings: {
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
  }
});

let memoryDb = null;

function loadDb() {
  if (memoryDb) return memoryDb;
  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      memoryDb = JSON.parse(raw);
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
  // State API
  getState() {
    const db = loadDb();
    // Return newest transactions first up to 5000
    const sortedTx = [...db.transactions].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).slice(0, 5000);
    // Return newest documents up to 100
    const sortedDocs = [...db.documents].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 100);

    return {
      transactions: sortedTx,
      tags: db.tags || [],
      rules: db.rules || [],
      settings: db.settings || {},
      documents: sortedDocs
    };
  },

  // Transactions
  addTransactions(rawBatch, options = {}) {
    const db = loadDb();
    const batch = Array.isArray(rawBatch) ? rawBatch : [rawBatch];

    let insertedCount = 0;
    let duplicateCount = 0;
    const insertedRows = [];
    const duplicates = [];

    for (const item of batch) {
      const date = item.date || new Date().toISOString().split('T')[0];
      const merchant = (item.merchant || '').trim();
      const amount = Math.abs(parseFloat(item.amount) || 0);
      const type = item.type === 'income' ? 'income' : 'expense';
      const account = (item.account || 'Imported account').trim();

      if (!merchant || isNaN(amount) || amount <= 0) {
        continue; // invalid transaction
      }

      const fp = generateFingerprint(date, merchant, amount, account);

      // Check for duplicate fingerprint
      const existing = db.transactions.find(t => t.fingerprint === fp);
      if (existing) {
        duplicateCount++;
        duplicates.push(existing);
        continue;
      }

      // Check rules if enabled
      let category = item.category || 'Needs review';
      let tagsArray = Array.isArray(item.tags) ? item.tags : [];

      if (db.rules && db.rules.length > 0) {
        for (const rule of db.rules) {
          if (!rule.enabled) continue;
          const whenLower = rule.whenText.toLowerCase().trim();
          if (merchant.toLowerCase().includes(whenLower)) {
            if (rule.thenCategory) category = rule.thenCategory;
            if (rule.thenTag && !tagsArray.includes(rule.thenTag)) {
              tagsArray.push(rule.thenTag);
            }
          }
        }
      }

      // Deduplicate tags
      tagsArray = Array.from(new Set(tagsArray.map(t => t.trim()).filter(Boolean)));

      const newTx = {
        id: item.id || `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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

  updateTransaction(id, updates) {
    const db = loadDb();
    const idx = db.transactions.findIndex(t => t.id === id);
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

  deleteTransaction(id) {
    const db = loadDb();
    const idx = db.transactions.findIndex(t => t.id === id);
    if (idx === -1) return false;
    db.transactions.splice(idx, 1);
    saveDb();
    return true;
  },

  // Preferences
  updatePreferences(updates) {
    const db = loadDb();
    db.settings = {
      ...db.settings,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    // If tags array updated in settings, also sync tags table
    if (updates.tags && Array.isArray(updates.tags)) {
      const existingNames = new Set(db.tags.map(t => t.name));
      for (const tagName of updates.tags) {
        if (!existingNames.has(tagName)) {
          db.tags.push({ name: tagName, createdAt: new Date().toISOString() });
        }
      }
    }

    saveDb();
    return db.settings;
  },

  // Tags
  addTag(tagName) {
    const db = loadDb();
    const name = tagName.trim();
    if (!name) return null;
    let existing = db.tags.find(t => t.name.toLowerCase() === name.toLowerCase());
    if (!existing) {
      existing = { name, createdAt: new Date().toISOString() };
      db.tags.push(existing);
      saveDb();
    }
    return existing;
  },

  deleteTag(tagName) {
    const db = loadDb();
    const idx = db.tags.findIndex(t => t.name.toLowerCase() === tagName.toLowerCase());
    if (idx !== -1) {
      db.tags.splice(idx, 1);
      saveDb();
      return true;
    }
    return false;
  },

  // Rules
  addRule(rule) {
    const db = loadDb();
    const newRule = {
      id: rule.id || `rule_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      whenText: rule.whenText,
      thenText: rule.thenText,
      thenCategory: rule.thenCategory || '',
      thenTag: rule.thenTag || '',
      enabled: rule.enabled !== undefined ? (rule.enabled ? 1 : 0) : 1,
      createdAt: new Date().toISOString()
    };
    db.rules.push(newRule);
    saveDb();
    return newRule;
  },

  updateRule(id, updates) {
    const db = loadDb();
    const rule = db.rules.find(r => r.id === id);
    if (!rule) return null;
    if (updates.enabled !== undefined) rule.enabled = updates.enabled ? 1 : 0;
    if (updates.whenText !== undefined) rule.whenText = updates.whenText;
    if (updates.thenText !== undefined) rule.thenText = updates.thenText;
    saveDb();
    return rule;
  },

  deleteRule(id) {
    const db = loadDb();
    const idx = db.rules.findIndex(r => r.id === id);
    if (idx !== -1) {
      db.rules.splice(idx, 1);
      saveDb();
      return true;
    }
    return false;
  },

  // R2 / Documents
  saveDocument(fileObj, source = 'upload') {
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
  wipeAllData() {
    const db = getInitialDb();
    db.settings.freshStart = true;
    db.settings.driveResetAt = new Date().toISOString();
    db.settings.assets = 0;
    db.settings.liabilities = 0;
    db.settings.netWorthConfigured = false;
    db.settings.selectedPeriod = 'all-time';

    memoryDb = db;
    saveDb();

    // Clean R2 storage directory safely
    try {
      if (fs.existsSync(R2_DIR)) {
        const files = fs.readdirSync(R2_DIR);
        for (const file of files) {
          const filePath = path.join(R2_DIR, file);
          try {
            fs.rmSync(filePath, { recursive: true, force: true });
          } catch (e) {
            // ignore individual locked file error
          }
        }
      }
    } catch (e) {
      console.error('Error clearing R2 directory:', e);
    }

    return true;
  }
};
