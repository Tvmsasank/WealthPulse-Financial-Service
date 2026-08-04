import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dbEngine } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Multer memory storage for up to 20MB file uploads
const upload = multer({
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB limit
});

// GET /api/state
app.get('/api/state', (req, res) => {
  try {
    const state = dbEngine.getState();
    res.json(state);
  } catch (err) {
    console.error('GET /api/state error:', err);
    res.status(500).json({ error: 'Failed to fetch state' });
  }
});

// POST /api/transactions
app.post('/api/transactions', (req, res) => {
  try {
    const batch = req.body;
    if (!batch) {
      return res.status(400).json({ error: 'Payload required' });
    }
    const result = dbEngine.addTransactions(batch);
    res.json(result);
  } catch (err) {
    console.error('POST /api/transactions error:', err);
    res.status(500).json({ error: 'Failed to add transactions' });
  }
});

// PATCH /api/transactions
app.patch('/api/transactions', (req, res) => {
  try {
    const { id, category, tags } = req.body;
    if (!id) {
      return res.status(400).json({ error: 'Transaction ID required' });
    }
    const updated = dbEngine.updateTransaction(id, { category, tags });
    if (!updated) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json(updated);
  } catch (err) {
    console.error('PATCH /api/transactions error:', err);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

// DELETE /api/transactions
app.delete('/api/transactions', (req, res) => {
  try {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: 'Transaction ID required' });
    }
    const success = dbEngine.deleteTransaction(id);
    if (!success) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json({ success: true, deletedId: id });
  } catch (err) {
    console.error('DELETE /api/transactions error:', err);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

// PUT /api/preferences
app.put('/api/preferences', (req, res) => {
  try {
    const updates = req.body;
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ error: 'Preferences object required' });
    }
    const updatedSettings = dbEngine.updatePreferences(updates);
    res.json(updatedSettings);
  } catch (err) {
    console.error('PUT /api/preferences error:', err);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// POST /api/documents
app.post('/api/documents', upload.array('files', 10), (req, res) => {
  try {
    const files = req.files || [];
    if (files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const savedDocs = [];
    for (const file of files) {
      // Check 20MB limit
      if (file.size > 20 * 1024 * 1024) {
        return res.status(400).json({ error: `File ${file.originalname} exceeds 20 MB limit` });
      }
      const doc = dbEngine.saveDocument({
        originalname: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        buffer: file.buffer,
        status: 'stored'
      }, 'upload');
      savedDocs.push(doc);
    }

    res.json({ success: true, documents: savedDocs });
  } catch (err) {
    console.error('POST /api/documents error:', err);
    res.status(500).json({ error: err.message || 'Failed to upload document' });
  }
});

// DELETE /api/state
app.delete('/api/state', (req, res) => {
  try {
    const { confirmation } = req.body || {};
    if (confirmation !== 'DELETE ALL LEDGERLY DATA') {
      return res.status(400).json({ error: 'Invalid confirmation phrase. Must match exactly: DELETE ALL LEDGERLY DATA' });
    }

    dbEngine.wipeAllData();
    const freshState = dbEngine.getState();

    res.json({
      success: true,
      message: 'All Ledgerly data erased successfully.',
      state: freshState
    });
  } catch (err) {
    console.error('DELETE /api/state error:', err);
    res.status(500).json({ error: 'Failed to erase state' });
  }
});

// GET /api/drive-sync
app.get('/api/drive-sync', (req, res) => {
  try {
    const state = dbEngine.getState();
    const settings = state.settings || {};

    res.json({
      folder: settings.driveFolder || {
        name: 'Ledgerly Financial Inbox',
        id: 'folder-ledgerly-inbox-01',
        url: 'https://drive.google.com/drive/folders/ledgerly-inbox'
      },
      schedule: {
        time: '08:00',
        timezone: 'Asia/Kolkata',
        cadence: 'daily'
      },
      lastSyncedAt: settings.driveSync?.lastSyncedAt || null,
      lastStatus: settings.driveSync?.lastStatus || 'idle',
      lastImportedCount: settings.driveSync?.lastImportedCount || 0,
      lastDuplicateCount: settings.driveSync?.lastDuplicateCount || 0,
      lastReviewCount: settings.driveSync?.lastReviewCount || 0,
      errors: settings.driveSync?.errors || [],
      processedFileIds: (settings.processedDriveFileIds || []).slice(0, 5000),
      resetAt: settings.driveResetAt || null
    });
  } catch (err) {
    console.error('GET /api/drive-sync error:', err);
    res.status(500).json({ error: 'Failed to fetch drive sync status' });
  }
});

// POST /api/drive-sync
app.post('/api/drive-sync', (req, res) => {
  try {
    const { transactions = [], files = [], errors = [] } = req.body || {};

    const state = dbEngine.getState();
    const settings = state.settings || {};
    const resetAt = settings.driveResetAt ? new Date(settings.driveResetAt) : null;
    const processedIds = new Set(settings.processedDriveFileIds || []);

    let txImportedCount = 0;
    let txDuplicateCount = 0;
    let filesStoredCount = 0;
    let filesReviewCount = 0;

    // Handle Transactions
    if (transactions.length > 0) {
      const txResult = dbEngine.addTransactions(transactions.map(t => ({
        ...t,
        source: 'google-drive',
        account: t.account || 'Drive import',
        tags: Array.from(new Set([...(t.tags || []), 'Drive import']))
      })));

      txImportedCount = txResult.insertedCount;
      txDuplicateCount = txResult.duplicateCount;
    }

    // Handle Files
    const newlyProcessedFileIds = [];
    for (const fileObj of files) {
      if (!fileObj.id) continue;

      // Ignore files modified at or before resetAt
      if (resetAt && fileObj.modifiedTime) {
        const modTime = new Date(fileObj.modifiedTime);
        if (modTime <= resetAt) {
          continue;
        }
      }

      if (processedIds.has(fileObj.id)) {
        continue;
      }

      const status = fileObj.status || 'stored';
      if (status === 'review') {
        filesReviewCount++;
      } else {
        filesStoredCount++;
      }

      dbEngine.saveDocument({
        filename: fileObj.filename,
        mimeType: fileObj.mimeType,
        size: fileObj.size,
        base64Content: fileObj.base64Content,
        status
      }, 'google-drive');

      newlyProcessedFileIds.push(fileObj.id);
      processedIds.add(fileObj.id);
    }

    // Update settings with sync results
    const updatedProcessed = Array.from(processedIds).slice(0, 5000);
    const syncStatus = errors.length > 0 ? (txImportedCount > 0 ? 'partial' : 'error') : 'complete';

    dbEngine.updatePreferences({
      processedDriveFileIds: updatedProcessed,
      driveSync: {
        schedule: '08:00 AM Daily',
        timezone: 'Asia/Kolkata',
        lastSyncedAt: new Date().toISOString(),
        lastStatus: syncStatus,
        lastImportedCount: txImportedCount,
        lastDuplicateCount: txDuplicateCount,
        lastReviewCount: filesReviewCount,
        errors: errors.slice(0, 5)
      }
    });

    res.json({
      status: syncStatus,
      lastSyncedAt: new Date().toISOString(),
      transactionsImported: txImportedCount,
      duplicatesSkipped: txDuplicateCount,
      filesStored: filesStoredCount,
      filesNeedingReview: filesReviewCount,
      errors
    });
  } catch (err) {
    console.error('POST /api/drive-sync error:', err);
    res.status(500).json({ error: 'Failed to process drive sync' });
  }
});

// Serve Vite production build static assets if built
const DIST_DIR = path.join(__dirname, '..', 'dist');
app.use(express.static(DIST_DIR));
app.get('*', (req, res, next) => {
  if (req.url.startsWith('/api')) return next();
  const indexPath = path.join(DIST_DIR, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Vite server running in dev mode. Access frontend at http://localhost:3000');
  }
});

app.listen(PORT, () => {
  console.log(`[Ledgerly] API Server running on port ${PORT}`);
});
