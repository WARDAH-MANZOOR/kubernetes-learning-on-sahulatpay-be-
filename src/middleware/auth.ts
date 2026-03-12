import { Request, Response, NextFunction, RequestHandler } from "express";
import { allowedCallbackIps } from "../utils/allowedCallbackIPs.js";
import { findWhiteListMerchantByTokenAndIP, findWhiteListMerchantByToken } from '../services/whiteListMerchants/index.js';


import {
  verifyHashedKey,
} from "../utils/authentication.js";
import prisma from "../prisma/client.js";
import dotenv from "dotenv";
dotenv.config();

export const apiKeyAuth: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Extract the API key from headers
  const apiKey = req.headers["x-api-key"] as string;
  const { merchantId } = req.params;

  if (!merchantId) {
    res.status(400).json({ error: "Merchant ID is required" });
    return

  }

  // Check if API key is missing
  if (!apiKey) {
    res.status(401).json({ error: "API key is missing" });
    return

  }

  try {
    // Retrieve the user associated with the API key from the database
    const merchant = await prisma.merchant.findFirst({
      where: {
        uid: merchantId as string,
      },
    });

    if (!merchant) {
      res.status(403).json({ error: "Unauthorized: Invalid API key" });
      return

    }

    const user = await prisma.user.findFirst({
      where: {
        id: merchant?.user_id,
      },
    });

    if (!user) {
      res.status(403).json({ error: "Unauthorized: Invalid API key" });
      return

    }

    const hashedKey = user?.apiKey;

    if (!hashedKey) {
      res.status(403).json({ error: "Unauthorized: Invalid API key" });
      return

    }

    const verify = verifyHashedKey(apiKey, hashedKey as string);
    if (!verify) {
      res.status(403).json({ error: "Unauthorized: Invalid API key" });
      return
    }
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const uidAuth: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Extract the API key from headers
  const { merchantId } = req.params;
  if (!merchantId) {
    res.status(400).json({ error: "Merchant ID is required" });
    return
  }
  try {
    // Retrieve the user associated with the API key from the database
    const merchant = await prisma.merchant.findFirst({
      where: {
        uid: merchantId as string,
      },
    });

    if (!merchant) {
      res.status(403).json({ error: "Invalid Merchant Id" });
      return
    }
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
export const authenticateTokenAndIP: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  const token = req.headers.authorization?.split(" ")[1];
  let ip = req.ip;

  if (!token) {
    res.status(401).json({ message: "Bearer token missing" });
    return;
  }


  // Remove IPv6-style prefixes if any
  if (ip?.startsWith("::ffff:")) {
    ip = ip.replace("::ffff:", "");
  } else if (ip?.startsWith("::")) {
    ip = ip.replace("::", "");
  }
  if (!ip) {
    res.status(400).json({ message: "Missing IP" });
    return;
  }

  const merchantuId = req.body.merchantId || req.params.merchantId || req.body.merchant_id

  const merchantRecord = await prisma.merchant.findFirst({
    where: { uid: merchantuId },
  });

  if (!merchantRecord) {
    res.status(404).json({ message: "Merchant UID not found" });
    return;
  }

  const merchantId = merchantRecord.merchant_id;

  const whiteListed = await findWhiteListMerchantByTokenAndIP(token, ip, merchantId);

  if (whiteListed) {
    req.body.merchantId = merchantId;
    return next();
  }

  const tokenOnly = await findWhiteListMerchantByToken(token, merchantId);

  if (tokenOnly) {
    res.status(403).json({ message: "IP is not whitelisted" });
    return;
  }

  res.status(401).json({ message: "Unauthorized: IP or token or merchantId mismatch" });
};

export const validateMerchantIp: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let ip = req.ip;

    // IPv6 prefixes handle karo
    if (ip?.startsWith("::ffff:")) {
      ip = ip.replace("::ffff:", "");
    } else if (ip?.startsWith("::")) {
      ip = ip.replace("::", "");
    }
    console.log("IP: ", ip)
    console.log({
      array_contains: ip, // 👈 Check if the list contains the request IP
    },
    )
    // merchant_id nikal lo
    const merchantUid =
      req.body.merchant_id || req.params.merchant_id || req.query.merchant_id || req.params.merchantId;

    if (!merchantUid) {
      res.status(400).json({ message: "Missing merchant_id" });
      return
    }

    // Merchant record find karo
    const merchantRecord = await prisma.merchant.findFirst({
      where: { uid: merchantUid },
    });

    if (!merchantRecord) {
      res.status(404).json({ message: "Merchant not found" });
      return
    }


    const merchantId = merchantRecord.merchant_id;

    const ipWhitelisted = await prisma.whiteListMerchant.findFirst({
      where: {
        merchantId: merchantId,
      },
    });

    // No whitelist record means no IP restriction
    if (!ipWhitelisted) {
      next()
      return
    }

    if (!ip) {
      res.status(400).json({ message: "Missing IP address" });
      return
    }


    // ips = null means no restriction
    if (ipWhitelisted.ips === null) {
      req.body.merchantId = merchantId;
      next();
      return;
    }

    const allowedIps = Array.isArray(ipWhitelisted.ips)
      ? ipWhitelisted.ips.filter((entry): entry is string => typeof entry === "string")
      : [];

    if (!allowedIps.includes(ip)) {
      res
        .status(403)
        .json({ message: "IP not allowed for this merchant" });
      return
    }

    // pass merchant info
    req.body.merchantId = merchantId;
    next();
  } catch (err: any) {
    res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
};


function normalizeIp(ip?: string): string {
  if (!ip) return ""; // agar undefined ho to empty string return
  if (ip.startsWith("::ffff:")) {
    ip = ip.replace("::ffff:", "");
  } else if (ip.startsWith("::")) {
    ip = ip.replace("::", "");
  }
  return ip;
}

export const validateCallbackIp: RequestHandler = (req, res, next) => {
  let ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || req.ip;

  if (Array.isArray(ip)) {
    ip = ip[0];
  }

  ip = normalizeIp(ip);

  if (!ip || !allowedCallbackIps.includes(ip)) {
    console.error("❌ Invalid callback IP:", ip);
    res.status(403).json({ message: "Forbidden: Invalid callback IP" });
    return
  }

  console.log("✅ Valid callback IP:", ip);
  next();
};
