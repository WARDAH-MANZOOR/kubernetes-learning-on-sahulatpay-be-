import { NextFunction, Request, RequestHandler, Response } from "express";
import prisma from "../prisma/client.js";
import { transactionService } from "../services/index.js";
import ApiResponse from "./ApiResponse.js";
import { decryptAESGCM, deriveKeys, generateHMACSignature } from "./dec_with_signing.js";
export const decryptEncryptedPayoutPayload: RequestHandler = async (
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
      return
    }

    if (!userId || !timestamp || !encrypted_data || !iv || !tag || !signature) {
       res.status(400).json(ApiResponse.error("Missing encryption fields"));
       return
    }

    // 🔑 merchant → user → key
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
        return
      }

      masterKey = Buffer.from(user.decryptionKey, "utf8");
    }

    const { hmacKey, aesKey } = deriveKeys(masterKey);

    // 🔐 signature verify
    const expectedSignature = generateHMACSignature(
      userId + timestamp + encrypted_data,
      hmacKey
    );

    if (signature !== expectedSignature) {
      res.status(403).json(ApiResponse.error("Invalid signature"));
      return
    }

    // ⏱ timestamp validation
    const now = Date.now();
    const requestTime = new Date(timestamp).getTime();
    if (Math.abs(now - requestTime) > 5 * 60 * 1000) {
      res.status(408).json(ApiResponse.error("Request expired"));
      return
    }

    // 🔓 decrypt
    const decryptedStr = decryptAESGCM(encrypted_data, aesKey, iv, tag);
    const decryptedPayload = JSON.parse(decryptedStr);

    console.log("🔓 PAYOUT Decrypted Payload:", decryptedPayload);

    // attach for controller
    req.body.decryptedPayload = decryptedPayload;

    next();
  } catch (err) {
    console.error("❌ Decryption middleware error", err);
    res.status(500).json(ApiResponse.error("Decryption failed"));
    return
  }
};
export default { decryptEncryptedPayoutPayload }