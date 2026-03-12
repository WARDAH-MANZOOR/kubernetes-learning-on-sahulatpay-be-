import crypto, { CipherKey } from "crypto";
import dotenv from "dotenv";
import { authenticationService } from "../services/index.js";
dotenv.config();

// Encryption algorithm and key
const algorithm = process.env.ENCRYPTION_ALGO as string;
const key = Buffer.from(process.env.ENCRYPTION_KEY as string, 'hex'); // 32 bytes key for AES-256
const iv = crypto.randomBytes(12);

function assertKey() {
  if (algorithm.startsWith("aes-256") && key.length !== 32) {
    throw new Error(`ENC_KEY must be 32 bytes (64 hex chars). Got ${key.length} bytes.`);
  }
  if (algorithm.startsWith("aes-128") && key.length !== 16) {
    throw new Error(`ENC_KEY must be 16 bytes (32 hex chars). Got ${key.length} bytes.`);
  }
}

function isHex(s: string) {
  return /^[0-9a-fA-F]+$/.test(s);
}

export function encryptV2(plainText: string): string {
  assertKey();

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);

  const cipherHex = cipher.update(plainText, "utf8", "hex") + cipher.final("hex");
  return `v2:${iv.toString("hex")}:${cipherHex}`;
}

// Encrypt function
function encrypt(text: string) {
  try {
  const iv = crypto.randomBytes(16); // Initialization vector
  const cipher = crypto.createCipheriv(algorithm, key as CipherKey, new Uint8Array(iv));
  let encrypted = cipher.update(text, 'hex');
  encrypted = Buffer.concat([new Uint8Array(encrypted), new Uint8Array(cipher.final())]);
  // Return iv and encrypted data combined
  return iv.toString('hex') + ':' + encrypted.toString('hex');
  }
  catch(err) {
    console.log("Encryption Error: ",err);
  }
}

function encryptUtf(text: string) {
  try {
  const iv = crypto.randomBytes(16); // Initialization vector
  const cipher = crypto.createCipheriv(algorithm, key as CipherKey, new Uint8Array(iv));
  let encrypted = cipher.update(text, 'utf8');
  encrypted = Buffer.concat([new Uint8Array(encrypted), new Uint8Array(cipher.final())]);
  // Return iv and encrypted data combined
  return iv.toString('hex') + ':' + encrypted.toString('hex');
  }
  catch(err) {
    console.log("Encryption Error: ",err);
  }
}
 
// Decrypt function 
function decrypt(text: string) {
  try {
    const [ivHex, encryptedHex] = text.split(':');
    const iv = Buffer.from(ivHex as string,"hex");
    const encryptedText = Buffer.from(encryptedHex as string,"hex");
    const decipher = crypto.createDecipheriv(algorithm, key as CipherKey, new Uint8Array(iv));
    let decrypted = decipher.update(new Uint8Array(encryptedText));
    decrypted = Buffer.concat([new Uint8Array(decrypted), new Uint8Array(decipher.final())]);
    return decrypted.toString('hex');
  }
  catch (err) {
    console.log("Decryption Error: ", err);
  }
}

export function decryptAny(payloadRaw: string): string {
  assertKey();

  const payload = (payloadRaw ?? "").trim();

  // --- v2 format: v2:<ivHex>:<cipherHex>
  if (payload.startsWith("v2:")) {
    // parse only first two ":" after v2
    const first = payload.indexOf(":", 3); // after "v2:"
    if (first === -1) {
      throw new Error(`Invalid v2 payload (missing iv/cipher). payload="${payload.slice(0, 60)}..."`);
    }
    const ivHex = payload.slice(3, first).trim();
    const cipherHex = payload.slice(first + 1).trim(); // rest (safe even if contains ":")

    if (ivHex.length !== 32 || !isHex(ivHex)) {
      throw new Error(`Invalid v2 iv (must be 32 hex chars). iv="${ivHex}"`);
    }
    if (cipherHex.length === 0 || cipherHex.length % 2 !== 0 || !isHex(cipherHex)) {
      throw new Error(
        `Invalid v2 cipher (must be even-length hex). len=${cipherHex.length} sample="${cipherHex.slice(0, 40)}"`
      );
    }

    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    return decipher.update(cipherHex, "hex", "utf8") + decipher.final("utf8");
  }

  // --- legacy format: <ivHex>:<cipherHex>
  const idx = payload.indexOf(":");
  if (idx !== -1) {
    const ivHex = payload.slice(0, idx).trim();
    const cipherHex = payload.slice(idx + 1).trim();

    if (ivHex.length === 32 && isHex(ivHex) && cipherHex.length > 0 && cipherHex.length % 2 === 0 && isHex(cipherHex)) {
      const iv = Buffer.from(ivHex, "hex");
      const decipher = crypto.createDecipheriv(algorithm, key, iv);
      return decipher.update(cipherHex, "hex", "utf8") + decipher.final("utf8");
    }
  }

  // If we reach here, it doesn't match either format
  throw new Error(
    `Invalid encrypted payload format. ` +
      `len=${payload.length}, startsWith="${payload.slice(0, 10)}", colons=${(payload.match(/:/g) || []).length}`
  );
}
function decryptUtf(text: string): string | undefined {
  try {
    const [ivHex, encryptedHex] = text.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const encryptedText = Buffer.from(encryptedHex, 'hex');

    const decipher = crypto.createDecipheriv(algorithm, key as CipherKey, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString('utf8'); // ✅ match the original input encoding
  } catch (err) {
    console.log("Decryption Error: ", err);
  }
}

function encryptData(payload: any, secretKey: string, iv: string) {
  // Ensure the payload is a JSON string
  const jsonString = JSON.stringify(payload);

  // Create a cipher instance
  const cipher = crypto.createCipheriv('aes-128-cbc', Buffer.from(secretKey) as CipherKey, new Uint8Array(Buffer.from(iv)));

  // Encrypt the data
  let encryptedData = cipher.update(jsonString, 'utf8', 'hex');
  encryptedData += cipher.final('hex');

  return encryptedData;
}

function decryptData(encryptedData: string, secretKey: string, iv: string) {
  // Create a decipher instance
  const decipher = crypto.createDecipheriv('aes-128-cbc', Buffer.from(secretKey) as CipherKey, new Uint8Array(Buffer.from(iv)));

  // Decrypt the data
  let decryptedData = decipher.update(encryptedData, 'hex', 'utf8');
  decryptedData += decipher.final('utf8');

  // Parse the decrypted JSON string
  const payload = JSON.parse(decryptedData);

  return payload;
}

async function callbackEncrypt(payload: string, userId: number) {
  try {
    console.log("User Id: ", userId);
    const key = await authenticationService.getDecryptionKey(userId);
    console.log("Key: ", key);
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key, 'hex') as CipherKey, new Uint8Array(iv));
    const encrypted = Buffer.concat([new Uint8Array(cipher.update(payload, 'utf8')), new Uint8Array(cipher.final())]);
    const tag = cipher.getAuthTag();
    return {
      encrypted_data: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      tag: tag.toString('base64')
    };
  }
  catch (err) {
    console.log(err);
  }
}

async function callbackDecrypt(encryptedData: string, iv: string, tag: string) {
  try {
    // Convert Base64 inputs to Buffers
    const encryptedBuffer = Buffer.from(encryptedData, 'base64');
    const ivBuffer = Buffer.from(iv, 'base64');
    const tagBuffer = Buffer.from(tag, 'base64');

    const key = await authenticationService.getDecryptionKey(5);

    // Create decipher
    const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(key, "hex") as CipherKey, new Uint8Array(ivBuffer));

    // Set the authentication tag
    decipher.setAuthTag(new Uint8Array(tagBuffer));

    // Decrypt the ciphertext
    const decrypted = Buffer.concat([
      new Uint8Array(decipher.update(new Uint8Array(encryptedBuffer))),
      new Uint8Array(decipher.final())
    ]);

    // Return plaintext as a string
    return decrypted.toString('utf8');
  } catch (err) {
    // Handle decryption errors (e.g., invalid tag or tampered data)
    throw new Error('Decryption failed: Authentication tag is invalid or data was tampered with.');
  }
}

export { encrypt, decrypt, encryptData, decryptData, callbackEncrypt, callbackDecrypt, decryptUtf, encryptUtf };
