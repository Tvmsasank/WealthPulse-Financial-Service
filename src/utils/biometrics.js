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
        authenticatorAttachment: 'platform', // Native Face ID / Touch ID / Fingerprint
        userVerification: 'required'
      },
      timeout: 60000
    }
  };

  const credential = await navigator.credentials.create(creationOptions);
  if (!credential) throw new Error('Biometric registration cancelled or failed');

  const credentialId = credential.id;

  // Send to backend API
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

  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to register biometrics');

  localStorage.setItem('ledgerly_biometric_credential', credentialId);
  return json;
}

export async function authenticateWithBiometrics() {
  const credentialId = localStorage.getItem('ledgerly_biometric_credential');
  if (!credentialId) {
    throw new Error('No Biometric Face ID / Fingerprint registered on this device yet. Please sign in and enable Biometrics in Settings.');
  }

  const challengeBuffer = crypto.getRandomValues(new Uint8Array(32));

  const requestOptions = {
    publicKey: {
      challenge: challengeBuffer,
      allowCredentials: [{
        id: new TextEncoder().encode(credentialId),
        type: 'public-key'
      }],
      userVerification: 'required',
      timeout: 60000
    }
  };

  let assertion;
  try {
    assertion = await navigator.credentials.get(requestOptions);
  } catch (e) {
    throw new Error('Face ID / Biometric verification cancelled');
  }

  const res = await fetch('/api/auth/webauthn/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credentialId })
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Biometric authentication failed');

  return json;
}
