/**
 * WebAuthn Native Biometric & Passkey Helper
 * Supports Apple Face ID / Touch ID, Android Fingerprint, Windows Hello
 */

export async function isBiometricsAvailable() {
  if (window.PublicKeyCredential && typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
    try {
      return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch (e) {
      return false;
    }
  }
  return false;
}

export async function registerBiometricPasskey(user, token) {
  if (!window.PublicKeyCredential) {
    throw new Error('Biometric WebAuthn authentication is not supported on this browser');
  }

  const userIdBuffer = new TextEncoder().encode(user.id);
  const challengeBuffer = crypto.getRandomValues(new Uint8Array(32));

  const creationOptions = {
    publicKey: {
      rp: { name: 'Ledgerly Financial Portfolio' },
      user: {
        id: userIdBuffer,
        name: user.email,
        displayName: user.name || user.email
      },
      challenge: challengeBuffer,
      pubKeyCredParams: [{ alg: -7, type: 'public-key' }, { alg: -257, type: 'public-key' }],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'preferred'
      },
      timeout: 60000
    }
  };

  let credential;
  try {
    credential = await navigator.credentials.create(creationOptions);
  } catch (e) {
    if (e.name === 'NotAllowedError') {
      throw new Error('Passkey / Biometric creation timed out or was cancelled. If on Windows Chrome, ensure Google Password Manager or Windows Hello is enabled.');
    }
    throw new Error(e.message || 'Biometric registration cancelled');
  }

  if (!credential) throw new Error('Biometric registration cancelled or failed');

  const credentialId = credential.id;

  const res = await fetch('/api/auth/webauthn/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      credentialId,
      publicKey: credentialId
    })
  });

  let json;
  try {
    json = await res.json();
  } catch (e) {
    throw new Error('API server connection lost. Please ensure npm run dev:all is running.');
  }

  if (!res.ok) throw new Error(json.error || 'Failed to register biometrics');

  localStorage.setItem('ledgerly_biometric_credential', credentialId);
  return json;
}

export async function authenticateWithBiometrics() {
  const credentialId = localStorage.getItem('ledgerly_biometric_credential');
  if (!credentialId) {
    throw new Error('No Biometric Face ID / Fingerprint registered on this device yet. Please sign in and enable Biometrics in your profile.');
  }

  const challengeBuffer = crypto.getRandomValues(new Uint8Array(32));

  const requestOptions = {
    publicKey: {
      challenge: challengeBuffer,
      allowCredentials: [{
        id: new TextEncoder().encode(credentialId),
        type: 'public-key'
      }],
      userVerification: 'preferred',
      timeout: 60000
    }
  };

  let assertion;
  try {
    assertion = await navigator.credentials.get(requestOptions);
  } catch (e) {
    if (e.name === 'NotAllowedError') {
      throw new Error('Biometric scan cancelled. Please try again or use 4-Digit MPIN / Password.');
    }
    throw new Error('Face ID / Biometric verification cancelled');
  }

  const res = await fetch('/api/auth/webauthn/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credentialId })
  });

  let json;
  try {
    json = await res.json();
  } catch (e) {
    throw new Error('API server connection lost. Please ensure npm run dev:all is running.');
  }

  if (!res.ok) throw new Error(json.error || 'Biometric authentication failed');

  return json;
}
