// controllers/whitelist.controller.ts
import { Request, Response,RequestHandler, NextFunction } from "express";

import { whitelistService } from "../../services/index.js";


export const createWhiteListMerchant = async (req: Request, res: Response) => {
  const { merchantId, company_name,merchant_name } = req.body;

  try {
    const result = await whitelistService.createWhiteListMerchant(merchantId, company_name, merchant_name);
    res.status(201).json(result);
  
  } catch (err) {
  console.error("Whitelist Merchant Error:", err);
  res.status(500).json({ error: "Failed to whitelist merchant" });
}

};



// controllers/whitelist.controller.ts
export const addWhiteListMerchantIP: RequestHandler = async (req, res, next) => {
  const { merchantId, ips } = req.body;

  // ✅ Basic validation
  if (!merchantId || typeof merchantId !== "number") {
    res.status(400).json({ error: "Valid 'merchantId' is required" });
    return;
  }

  if (!ips) {
    res.status(400).json({ error: "'ips' field is required" });
    return;
  }

  if (!Array.isArray(ips) || !ips.every(i => typeof i === "string")) {
    res.status(400).json({ error: "'ips' must be an array of strings" });
    return;
  }

  try {
    const result = await whitelistService.updateWhiteListMerchantIP(merchantId, ips);
    res.status(200).json(result);
  } catch (err) {
    console.error("❌ Failed to update IPs:", err);
    res.status(500).json({ error: "Failed to update IPs" });
  }
};

export const getAllWhiteListMerchants = async (req: Request, res: Response) => {
  try {
    const merchantId = req.query.merchantId
      ? parseInt(req.query.merchantId as string)
      : undefined;

    const result = await whitelistService.getAllWhiteListMerchants(merchantId);
    res.status(200).json(result);
  } catch (err) {
    console.error("Get WhiteList Merchants Error:", err);
    res.status(500).json({ error: "Failed to fetch whitelist merchants" });
  }
};
// controllers/whitelist.controller.ts

export const deleteWhiteListMerchant: RequestHandler = async (req, res, next) => {
  const merchantId = parseInt(req.params.merchantId as string);

  if (isNaN(merchantId)) {
    res.status(400).json({ error: "Invalid merchant ID" });
    return; // 👈 return here to avoid continuing
  }

  try {
    const result = await whitelistService.deleteWhiteListMerchant(merchantId);
    res.status(200).json(result);
  } catch (err) {
    console.error("Delete Whitelist Merchant Error:", err);
    res.status(500).json({ error: "Failed to delete whitelist merchant" });
  }
};


export const updateWhiteListMerchant: RequestHandler = async (req, res, next) => {
  const merchantId = parseInt(req.params.merchantId as string);
  const { token, ips } = req.body;

  if (isNaN(merchantId)) {
    res.status(400).json({ error: "Invalid merchantId in URL" });
    return;
  }

  if (!token && !ips) {
    res.status(400).json({ error: "Provide at least one field: token or ips" });
    return;
  }

  try {
    const dataToUpdate: { token?: string; ips?: string[] } = {};

    if (token) dataToUpdate.token = token;

    if (Array.isArray(ips) && ips.every(i => typeof i === 'string')) {
      dataToUpdate.ips = ips;
    }

    const updated = await whitelistService.updateWhiteListMerchant(merchantId, dataToUpdate);

    res.status(200).json(updated);
  } catch (err) {
    console.error("❌ Update failed:", err);
    res.status(500).json({ error: "Failed to update white list merchant" });
  }
};



export default {
   createWhiteListMerchant, updateWhiteListMerchant,getAllWhiteListMerchants,addWhiteListMerchantIP,deleteWhiteListMerchant };