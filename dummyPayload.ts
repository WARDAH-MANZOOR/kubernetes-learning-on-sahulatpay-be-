import crypto from "crypto";
import {
  deriveKeys,
  encryptAESGCM,
  generateHMACSignature,
  verifyDerivedKeys
} from "./src/utils/dec_with_signing.js"

interface JazzCashPayInPayload {
  amount: string;
  phone: string;
  type: string;
  order_id: string;
}
interface JazzCashPayoutPayload {
  amount: string;
  phone: string;
  iban: string;
  bankCode: string;
  order_id: string;
}

interface EasyPaisaPayinPayload {
  amount: string;
  phone: string;
  type: string;
  order_id: string;
  email: String;
}
interface EasyPaisaPayoutPayload {
  amount: number;
  phone: string;
  order_id: string;
}

interface EncryptedData {
  encryptedData: string;
  iv: string;
  tag: string;
}
interface QRPaymentPayload {
  amount: string;
  phone: string;
  store_name: string;
  description?: string;
  order_id: string;
  return_url: string;
}

interface FinalPayload {
  userId: string;
  timestamp: string;
  encrypted_data: string;
  iv: string;
  tag: string;
  signature: string;
  master_secret_key?: string;
}


// // // ============ CONFIGURABLE JAZZCASH PAYIN  ==============
const userId: string = "f2e2586e-d17b-4fe6-a905-2148f5e4bf15"; // Replace with actual
const masterKey: Buffer = Buffer.from("de640e9106c90c0ddd07ec382975e4ada60b6ded63bbbda1767746e0f366a63f", "utf8"); // Replace with actual secret

const payload: JazzCashPayInPayload = {
  amount: "1",
  phone: "03142304891",
  type: "wallet",
  order_id: "dnaslnlnlsda",
};

// === ENCRYPTION & SIGNING ===
const { hmacKey, aesKey } = deriveKeys(masterKey);
console.log(hmacKey.toString('base64'), aesKey.toString('base64'))
const timestamp: string = new Date().toISOString();

const encrypted: EncryptedData = encryptAESGCM(JSON.stringify(payload), aesKey);
const signature: string = generateHMACSignature(
  userId + timestamp + encrypted.encryptedData,
  hmacKey
);

const finalPayload: FinalPayload = {
  userId,
  timestamp,
  encrypted_data: encrypted.encryptedData,
  iv: encrypted.iv,
  tag: encrypted.tag,
  signature
};

console.log("✅ Final Payload to use in Postman:");
console.log(JSON.stringify(finalPayload, null, 2));

// // ============ CONFIGURABLE JAZZCASH PAYOUT  ==============
// const userId = "test-user";
// const masterKey = Buffer.from(
//   "de640e9106c90c0ddd07ec382975e4ada60b6ded63bbbda1767746e0f366a63f",
//   "utf8"
// );

// // 🟢 PAYOUT BODY (PLAIN)
// const payload: JazzCashPayoutPayload = {
//   amount: "2",
//   phone: "923222439062",
//   iban: "PK51MEZN0099640106991141",
//   bankCode: "66",
//   order_id: "PAYOUT-ORDER-1234"
// };

// // 🔐 ENCRYPTION
// const { aesKey, hmacKey } = deriveKeys(masterKey);
// const timestamp = new Date().toISOString();

// const encrypted = encryptAESGCM(JSON.stringify(payload), aesKey);

// const signature = generateHMACSignature(
//   userId + timestamp + encrypted.encryptedData,
//   hmacKey
// );

// // 🧾 FINAL REQUEST BODY (POSTMAN)
// const finalPayload = {
//   userId,
//   timestamp,
//   encrypted_data: encrypted.encryptedData,
//   iv: encrypted.iv,
//   tag: encrypted.tag,
//   signature,
//   master_secret_key: masterKey.toString("utf8")
// };

// console.log(JSON.stringify(finalPayload, null, 2));

// === CONFIGURABLE EASYPAISA PAYIN===
// const userId: string = "test-user"; // Replace with actual
// const masterKey: Buffer = Buffer.from("b03ec95611bb436577a6aa29c0d5e022d9def32a5bd6242596a88339669407f0", "utf8"); // Replace with actual secret

// const payload: EasyPaisaPayinPayload = {
//     amount: "1",
//     phone: "03162309607",
//     type: "wallet",
//     order_id: "kdnalndlkanlndasla",
//     email: "abc@gmail.com"
// };

// // === ENCRYPTION & SIGNING ===
// const { hmacKey, aesKey } = deriveKeys(masterKey);
// const timestamp: string = new Date().toISOString();

// const encrypted: EncryptedData = encryptAESGCM(JSON.stringify(payload), aesKey);
// const signature: string = generateHMACSignature(
//   userId + timestamp + encrypted.encryptedData,
//   hmacKey
// );

// const finalPayload: FinalPayload = {
//   userId,
//   timestamp,
//   encrypted_data: encrypted.encryptedData,
//   iv: encrypted.iv,
//   tag: encrypted.tag,
//   signature
// };

// console.log("✅ Final Payload to use in Postman:");
// console.log(JSON.stringify(finalPayload, null, 2));


// // ============ CONFIGURABLE EASYPAISA PAYOUT  ==============
// const userId = "test-user";
// const masterKey = Buffer.from(
//   "de640e9106c90c0ddd07ec382975e4ada60b6ded63bbbda1767746e0f366a63f",
//   "utf8"
// );

// // 🟢 PAYOUT BODY (PLAIN)
// const payload: EasyPaisaPayoutPayload = {
//   amount: 2,
//   phone: "923222439062",
//   order_id: "PAYOUT-ORDER-1234"
// };

// // 🔐 ENCRYPTION
// const { aesKey, hmacKey } = deriveKeys(masterKey);
// const timestamp = new Date().toISOString();

// const encrypted = encryptAESGCM(JSON.stringify(payload), aesKey);

// const signature = generateHMACSignature(
//   userId + timestamp + encrypted.encryptedData,
//   hmacKey
// );

// // 🧾 FINAL REQUEST BODY (POSTMAN)
// const finalPayload = {
//   userId,
//   timestamp,
//   encrypted_data: encrypted.encryptedData,
//   iv: encrypted.iv,
//   tag: encrypted.tag,
//   signature,
//   master_secret_key: masterKey.toString("utf8")
// };

// console.log(JSON.stringify(finalPayload, null, 2));




// ============ CONFIGURABLE CREATE PAYMENT REQUEST QR  ==============
// const userId = "test-user";
// const masterKey = Buffer.from(
//   "de640e9106c90c0ddd07ec382975e4ada60b6ded63bbbda1767746e0f366a63f",
//   "utf8"
// );

// // 🟢 PLAIN QR DATA
// const payload = {
//   amount: "2",
//   phone: "923039128174",
//   store_name: "Wardah Store",
//   description: "QR payment",
//   order_id: "QR-ORDER-1235",
//   return_url: "https://merchant.site/return"
// };
// // console.log(JSON.stringify(payload, null, 2));
// // 🔐 ENCRYPTION
// const { aesKey, hmacKey } = deriveKeys(masterKey);
// const timestamp = new Date().toISOString();

// const encrypted = encryptAESGCM(JSON.stringify(payload), aesKey);

// const signature = generateHMACSignature(
//   userId + timestamp + encrypted.encryptedData,
//   hmacKey
// );

// // 🧾 FINAL REQUEST BODY (POSTMAN)
// const finalPayload = {
//   userId,
//   timestamp,
//   encrypted_data: encrypted.encryptedData,
//   iv: encrypted.iv,
//   tag: encrypted.tag,
//   signature,
//   master_secret_key: masterKey.toString("utf8")
// };

// console.log(JSON.stringify(finalPayload, null, 2));