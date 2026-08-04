const API_BASE = 'http://localhost:3001';

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const fetchOpts = { ...options };
  if (fetchOpts.body && typeof fetchOpts.body === 'object') {
    fetchOpts.body = JSON.stringify(fetchOpts.body);
    fetchOpts.headers = {
      'Content-Type': 'application/json',
      ...(fetchOpts.headers || {})
    };
  }

  const res = await fetch(url, fetchOpts);
  let json;
  try {
    json = await res.json();
  } catch (e) {
    json = null;
  }
  return { status: res.status, json };
}

async function runVerification() {
  console.log('=== Starting Ledgerly Comprehensive Verification ===');

  // Reset database to ensure clean baseline before running test sequence
  console.log('\n[0] Resetting baseline database...');
  await request('/api/state', {
    method: 'DELETE',
    body: { confirmation: 'DELETE ALL LEDGERLY DATA' }
  });

  // 1. Initial State Contract Verification
  console.log('\n[1] Testing GET /api/state (Empty-Start Contract)...');
  const stateRes = await request('/api/state');
  if (stateRes.status !== 200) throw new Error('GET /api/state failed');
  const state = stateRes.json;

  console.log('✓ Initial transactions count:', state.transactions.length);
  console.log('✓ Initial documents count:', state.documents.length);
  console.log('✓ Initial Net Worth Configured:', state.settings.netWorthConfigured);
  console.log('✓ Initial Selected Period:', state.settings.selectedPeriod);

  if (state.transactions.length !== 0 || state.documents.length !== 0) {
    throw new Error('FAIL: Initial state is not empty!');
  }
  if (state.settings.netWorthConfigured !== false) {
    throw new Error('FAIL: Net worth should be false initially!');
  }

  // 2. Transaction Insertion & Duplicate Fingerprint Detection
  console.log('\n[2] Testing POST /api/transactions & Duplicate Fingerprint Detector...');
  const testTx = {
    date: '2026-08-01',
    merchant: 'Coffee Shop Test',
    amount: 5.50,
    type: 'expense',
    account: 'Main Checking',
    category: 'Dining',
    tags: ['TestTag']
  };

  const addRes1 = await request('/api/transactions', {
    method: 'POST',
    body: testTx
  });
  console.log('✓ First insertion result:', addRes1.json);
  if (addRes1.json.insertedCount !== 1) throw new Error('Failed to insert test transaction');

  // Attempt duplicate insertion
  const addRes2 = await request('/api/transactions', {
    method: 'POST',
    body: testTx
  });
  console.log('✓ Duplicate attempt result:', addRes2.json);
  if (addRes2.json.duplicateCount !== 1 || addRes2.json.insertedCount !== 0) {
    throw new Error('FAIL: Duplicate detector did not reject identical transaction!');
  }

  // 3. Inline Category & Tag Patching
  console.log('\n[3] Testing PATCH /api/transactions...');
  const insertedId = addRes1.json.insertedRows[0].id;
  const patchRes = await request('/api/transactions', {
    method: 'PATCH',
    body: {
      id: insertedId,
      category: 'Groceries',
      tags: ['TestTag', 'UpdatedTag']
    }
  });
  console.log('✓ Patch result category:', patchRes.json.category);
  if (patchRes.json.category !== 'Groceries') throw new Error('PATCH category failed');

  // 4. Preferences Persistence (Period & Net Worth)
  console.log('\n[4] Testing PUT /api/preferences...');
  const prefRes = await request('/api/preferences', {
    method: 'PUT',
    body: {
      assets: 25000,
      liabilities: 5000,
      netWorthConfigured: true,
      selectedPeriod: 'this-month'
    }
  });
  console.log('✓ Preferences saved. Net Worth:', prefRes.json.assets - prefRes.json.liabilities);
  if (prefRes.json.selectedPeriod !== 'this-month') throw new Error('PUT preferences failed');

  // 5. Drive Sync Endpoint Verification
  console.log('\n[5] Testing GET & POST /api/drive-sync...');
  const driveGetRes = await request('/api/drive-sync');
  console.log('✓ Drive sync folder name:', driveGetRes.json.folder.name);
  console.log('✓ Drive sync schedule:', driveGetRes.json.schedule);

  // 6. Complete Data Wipe (DELETE /api/state) & Handoff Clean Up
  console.log('\n[6] Testing DELETE /api/state (Data Wipe)...');
  const wipeRes = await request('/api/state', {
    method: 'DELETE',
    body: { confirmation: 'DELETE ALL LEDGERLY DATA' }
  });
  console.log('✓ Wipe result success:', wipeRes.json.success);
  console.log('✓ Wipe result message:', wipeRes.json.message);

  // Final State Check
  const finalStateRes = await request('/api/state');
  const finalState = finalStateRes.json;
  console.log('✓ Final transactions count after wipe:', finalState.transactions.length);
  console.log('✓ Final Net Worth Configured after wipe:', finalState.settings.netWorthConfigured);
  console.log('✓ Final Selected Period after wipe:', finalState.settings.selectedPeriod);
  console.log('✓ Drive Reset At timestamp recorded:', finalState.settings.driveResetAt);

  if (finalState.transactions.length !== 0 || finalState.settings.netWorthConfigured !== false || finalState.settings.selectedPeriod !== 'all-time') {
    throw new Error('FAIL: State wipe did not restore clean empty contract!');
  }

  console.log('\n=== ALL VERIFICATION TESTS PASSED SUCCESSFULLY! ===\n');
}

runVerification().catch(err => {
  console.error('\n❌ Verification Failed:', err);
  process.exit(1);
});
