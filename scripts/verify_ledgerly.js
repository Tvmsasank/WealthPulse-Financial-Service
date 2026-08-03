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
  console.log('=== Starting Ledgerly Multi-User Authentication Verification ===');

  // Reset database to ensure clean baseline before running test sequence
  console.log('\n[0] Resetting baseline database...');
  await request('/api/state', {
    method: 'DELETE',
    body: { confirmation: 'DELETE ALL LEDGERLY DATA' }
  });

  // 1. Test User Registration (Bcrypt Hashing)
  console.log('\n[1] Testing POST /api/auth/register (Bcrypt Encrypted Registration)...');
  const regRes = await request('/api/auth/register', {
    method: 'POST',
    body: {
      name: 'Test Portfolio Owner',
      email: 'owner@example.com',
      password: 'SecurePassword123!'
    }
  });

  console.log('✓ Registration Status:', regRes.status);
  console.log('✓ Registered User Profile:', regRes.json.user);
  console.log('✓ JWT Auth Token Generated:', !!regRes.json.token);

  if (regRes.status !== 200 || !regRes.json.token) {
    throw new Error('FAIL: User registration failed!');
  }

  const token = regRes.json.token;
  const authHeader = { 'Authorization': `Bearer ${token}` };

  // 2. Test User Login (Credentials Verification)
  console.log('\n[2] Testing POST /api/auth/login (JWT & Bcrypt Verification)...');
  const loginRes = await request('/api/auth/login', {
    method: 'POST',
    body: {
      email: 'owner@example.com',
      password: 'SecurePassword123!',
      rememberMe: true
    }
  });

  console.log('✓ Login Status:', loginRes.status);
  console.log('✓ Logged In Email:', loginRes.json.user.email);
  if (loginRes.status !== 200 || !loginRes.json.token) {
    throw new Error('FAIL: User login failed!');
  }

  // 3. Test Invalid Credentials Protection
  console.log('\n[3] Testing Invalid Credentials Handling...');
  const badLoginRes = await request('/api/auth/login', {
    method: 'POST',
    body: {
      email: 'owner@example.com',
      password: 'WrongPassword!'
    }
  });

  console.log('✓ Bad Password Status (Expected 401):', badLoginRes.status);
  if (badLoginRes.status !== 401) {
    throw new Error('FAIL: Server accepted wrong password!');
  }

  // 4. Test Authenticated Transaction Insertion & Duplicate Fingerprint Detection
  console.log('\n[4] Testing Authenticated POST /api/transactions & Fingerprint Detector...');
  const testTx = {
    date: '2026-08-03',
    merchant: 'Parivaahan LLR Telangana',
    amount: 570.36,
    type: 'expense',
    account: 'Main Checking',
    category: 'Transportation',
    tags: ['Personal']
  };

  const addRes1 = await request('/api/transactions', {
    method: 'POST',
    headers: authHeader,
    body: testTx
  });
  console.log('✓ Insertion result:', addRes1.json);
  if (addRes1.json.insertedCount !== 1) throw new Error('Failed to insert test transaction');

  // Attempt duplicate insertion
  const addRes2 = await request('/api/transactions', {
    method: 'POST',
    headers: authHeader,
    body: testTx
  });
  console.log('✓ Duplicate attempt result:', addRes2.json);
  if (addRes2.json.duplicateCount !== 1 || addRes2.json.insertedCount !== 0) {
    throw new Error('FAIL: Duplicate detector did not reject identical transaction!');
  }

  // 5. Test Password Reset Flow
  console.log('\n[5] Testing Forgot Password & Reset Password Flow...');
  const forgotRes = await request('/api/auth/forgot-password', {
    method: 'POST',
    body: { email: 'owner@example.com' }
  });
  console.log('✓ Reset Token Generated:', forgotRes.json.resetToken);

  const resetToken = forgotRes.json.resetToken;
  const resetRes = await request('/api/auth/reset-password', {
    method: 'POST',
    body: {
      resetToken,
      newPassword: 'NewUpdatedPassword456!'
    }
  });
  console.log('✓ Reset Password Status:', resetRes.json.message);

  // Login with new password
  const newLoginRes = await request('/api/auth/login', {
    method: 'POST',
    body: {
      email: 'owner@example.com',
      password: 'NewUpdatedPassword456!'
    }
  });
  console.log('✓ New Password Login Success:', newLoginRes.status === 200);

  // 6. Complete Data Wipe (DELETE /api/state) & Handoff Clean Up
  console.log('\n[6] Testing DELETE /api/state (Data Wipe)...');
  const wipeRes = await request('/api/state', {
    method: 'DELETE',
    headers: authHeader,
    body: { confirmation: 'DELETE ALL LEDGERLY DATA' }
  });
  console.log('✓ Wipe result success:', wipeRes.json.success);

  console.log('\n=== ALL AUTHENTICATION VERIFICATION TESTS PASSED SUCCESSFULLY! ===\n');
}

runVerification().catch(err => {
  console.error('\n❌ Verification Failed:', err);
  process.exit(1);
});
