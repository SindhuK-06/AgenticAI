const crypto = require('crypto');
const { CREDENTIAL_ENCRYPTION_KEY } = require('../config/env');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Standard for GCM
const AUTH_TAG_LENGTH = 16;

// Derive a 32-byte key from CREDENTIAL_ENCRYPTION_KEY
const getKey = () => {
  return crypto.createHash('sha256').update(CREDENTIAL_ENCRYPTION_KEY).digest();
};

/**
 * Encrypts an object or string into a payload with IV and Auth Tag
 */
const encrypt = (data) => {
  if (!data) return null;
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  const text = typeof data === 'object' ? JSON.stringify(data) : String(data);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  
  // Format: iv:authTag:encryptedData
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
};

/**
 * Decrypts a payload into original data (parsed as JSON if possible)
 */
const decrypt = (encryptedText) => {
  if (!encryptedText) return null;
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted token format');
    }
    const [ivHex, authTagHex, encryptedData] = parts;
    const key = getKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    try {
      return JSON.parse(decrypted);
    } catch {
      return decrypted;
    }
  } catch (err) {
    console.error('[Crypto] Decryption failure:', err.message);
    throw new Error('Failed to decrypt credentials: Corrupted or invalid key');
  }
};

module.exports = {
  encrypt,
  decrypt,
};
