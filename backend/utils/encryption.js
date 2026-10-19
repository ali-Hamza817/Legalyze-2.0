/**
 * encryption.js — authenticated encryption for sensitive data AT REST.
 *
 * Uses AES-256-GCM (confidentiality + integrity): tampering is detected on decrypt.
 * Intended for sensitive PII that is stored but must be readable back — e.g. a client's
 * CNIC, phone, address in User.extractedFacts. (Passwords must NOT use this — they are
 * one-way hashed with bcrypt; encryption is for data you need to recover.)
 *
 * Key: derived by SHA-256 from process.env.ENCRYPTION_KEY (falls back to JWT_SECRET so
 * it works out of the box; set a dedicated ENCRYPTION_KEY in production). Rotating the
 * key makes previously-encrypted values unreadable, so rotate deliberately.
 *
 * Wire format:  ivHex:authTagHex:cipherHex   (so it is self-describing and idempotent-
 * safe: decrypt() returns non-encrypted input unchanged).
 *
 *   const { encrypt, decrypt } = require('./utils/encryption');
 *   user.extractedFacts.personal.cnic = encrypt(cnic);   // on write
 *   const cnic = decrypt(user.extractedFacts.personal.cnic); // on read
 */
const crypto = require('crypto');

const ALGO = 'aes-256-gcm';

function getKey() {
    const raw = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || '';
    if (!raw) throw new Error('ENCRYPTION_KEY (or JWT_SECRET) must be set for encryption');
    return crypto.createHash('sha256').update(String(raw)).digest(); // 32-byte key
}

/** Encrypt a string/number. Returns "iv:tag:cipher" (hex). Null/undefined pass through. */
function encrypt(plain) {
    if (plain === null || plain === undefined || plain === '') return plain;
    const iv = crypto.randomBytes(12); // 96-bit nonce, recommended for GCM
    const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
    const enc = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${tag.toString('hex')}:${enc.toString('hex')}`;
}

/** Decrypt an "iv:tag:cipher" payload. Anything that isn't our format is returned as-is. */
function decrypt(payload) {
    if (typeof payload !== 'string' || payload.split(':').length !== 3) return payload;
    try {
        const [ivHex, tagHex, dataHex] = payload.split(':');
        const decipher = crypto.createDecipheriv(ALGO, getKey(), Buffer.from(ivHex, 'hex'));
        decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
        const dec = Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()]);
        return dec.toString('utf8');
    } catch (_e) {
        // Not our ciphertext, wrong key, or tampered — return input untouched.
        return payload;
    }
}

/** Convenience: encrypt/decrypt the string values of an object's named fields in place. */
function encryptFields(obj, fields) {
    if (!obj) return obj;
    for (const f of fields) if (obj[f] != null) obj[f] = encrypt(obj[f]);
    return obj;
}
function decryptFields(obj, fields) {
    if (!obj) return obj;
    for (const f of fields) if (obj[f] != null) obj[f] = decrypt(obj[f]);
    return obj;
}

module.exports = { encrypt, decrypt, encryptFields, decryptFields };
