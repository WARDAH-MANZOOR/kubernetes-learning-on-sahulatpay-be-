

import crypto from 'crypto';



/**
 * Generate RSA-SHA256 signature
 * @param body - Raw request body (string, unformatted JSON)
 * @param privateKey - Private key (PKCS#8 PEM format, provided by Moonton)
 */
export function signNew(body: string, privateKey: string): string {
  const signature = crypto.sign(
    "sha256",
    Buffer.from(body, "utf8"),
    {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_PADDING,
    }
  );

  // Base64 encode for sending in HTTP header
  return signature.toString("base64").trim();
}

/**
 * Verify RSA-SHA256 signature
 * @param body - Raw request body (string, unformatted JSON)
 * @param signature - Base64 signature string from `authorization` header
 * @param publicKey - Public key (X.509 PEM format, provided by Moonton)
 */
export function verifyNew(body: string, signature: string, publicKey: string): boolean {
  try {
    return crypto.verify(
      "sha256",
      Buffer.from(body, "utf8"),
      {
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_PADDING,
      },
      Buffer.from(signature, "base64")
    );
  } catch (err) {
    console.error("Signature verification error:", err);
    return false;
  }
}