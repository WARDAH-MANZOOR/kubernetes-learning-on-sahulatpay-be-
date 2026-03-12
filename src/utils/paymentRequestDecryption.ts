import { RequestHandler } from "express";
import prisma from "../prisma/client.js";
import ApiResponse from "./ApiResponse.js";
import {
  decryptAESGCM,
  deriveKeys,
  generateHMACSignature
} from "./dec_with_signing.js";

export const decryptEncryptedQRPayload: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const {
      userId,
      timestamp,
      encrypted_data,
      iv,
      tag,
      signature,
      master_secret_key
    } = req.body;

    const { merchantId } = req.params;

    if (!merchantId) {
      res.status(400).json(ApiResponse.error("Missing merchant id"));
      return;
    }

    if (!userId || !timestamp || !encrypted_data || !iv || !tag || !signature) {
      res.status(400).json(ApiResponse.error("Missing encryption fields"));
      return;
    }

    // 🔑 get master key
    let masterKey: Buffer;

    if (master_secret_key) {
      masterKey = Buffer.from(master_secret_key, "utf8");
    } else {
      const merchant = await prisma.merchant.findFirst({
        where: { uid: merchantId as string }
      });

      const user = await prisma.user.findUnique({
        where: { id: merchant?.merchant_id }
      });

      if (!user?.decryptionKey) {
        res.status(403).json(ApiResponse.error("Decryption key not found"));
        return;
      }

      masterKey = Buffer.from(user.decryptionKey, "utf8");
    }

    const { aesKey, hmacKey } = deriveKeys(masterKey);

    // 🔐 verify signature
    const expectedSignature = generateHMACSignature(
      userId + timestamp + encrypted_data,
      hmacKey
    );

    if (signature !== expectedSignature) {
      res.status(403).json(ApiResponse.error("Invalid signature"));
      return;
    }

    // ⏱ timestamp check (5 min)
    const now = Date.now();
    const reqTime = new Date(timestamp).getTime();
    if (Math.abs(now - reqTime) > 5 * 60 * 1000) {
      res.status(408).json(ApiResponse.error("Request expired"));
      return;
    }

    // 🔓 decrypt
    const decryptedStr = decryptAESGCM(encrypted_data, aesKey, iv, tag);
    const decryptedPayload = JSON.parse(decryptedStr);

    console.log("🔓 QR Decrypted Payload:", decryptedPayload);

    req.body.decryptedPayload = decryptedPayload; // 👈 attach
    next();
  } catch (err) {
    console.error("QR decrypt error", err);
    res.status(500).json(ApiResponse.error("Decryption failed"));
    return;
  }
};
