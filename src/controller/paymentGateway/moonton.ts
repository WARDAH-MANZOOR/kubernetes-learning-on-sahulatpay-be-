import { Request, Response, NextFunction, RequestHandler } from "express";
import { moontonService, transactionService } from "../../services/index.js";
import { getEnvConfigNew } from "../../utils/environments.js";
import { verifyNew } from "../../utils/signature.js";
import prisma from "../../prisma/client.js";
import { createHash } from "crypto";



export const createPaymentOrderNew = async (req: any, res: any) => {
  try {
    const rawBody: string | undefined = (req as any).rawBody;
    const data = req.body;

    if (!rawBody) {
      res.status(400).json({ resp_code: 1, resp_msg: "Missing raw body for signature verification" });
      return;
    }

    // 1) Signature from header (base64 only)
    let signature = String(req.headers["authorization"] || "").trim();
    if (!signature) {
      res.status(401).json({ resp_code: 1, resp_msg: "Missing authorization header" });
      return;
    }

    // 2) Debug hash to compare with CLI
    const bodyHashHex = createHash("sha256").update(rawBody, "utf8").digest("hex");
    console.log("[SERVER] SHA256(body) =", bodyHashHex);
    console.log("[SERVER] Signature (len):", signature.length);
    const config = getEnvConfigNew();

    // 3) Verify signature on RAW body
    const isValid = verifyNew(rawBody, signature, config.moonton_publicKey);
    if (!isValid) {
      res.status(401).json({ resp_code: 1, resp_msg: "Invalid signature" });
      return;
    }

    console.log("✔ Signature OK");
    // ✅ Now safe to trust data

    const required: (keyof typeof data)[] = [
      "merchant_id",
      "merchant_order_id",
      "country_or_region",
      "currency",
      "amount",
      "payment_method",
      "return_url",
      "notify_url",
      "description",
    ];

    for (const field of required) {
      if (!data[field]) {
        return res.status(400).json({
          resp_code: 1,
          resp_msg: `Missing required field: ${String(field)}`,
        });
      }
    }

    // if (data.merchant_id !== config.allowedMerchantId) {
    //   return res.status(403).json({
    //     resp_code: 1,
    //     resp_msg: `Merchant ID ${data.merchant_id} not allowed in ${config.env} environment.`,
    //   });
    // }

    // Business logic
    const result = await moontonService.createOrderNew(data, req.headers);

    return res.json({
      invoice_id: result.invoice_id,
      payment_url: result.payment_url,
      resp_code: 0,
      resp_msg: "Success",
    });
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ resp_code: 1, resp_msg: error.message || "Failed" });
    return;
  }
};

export const queryPaymentOrderNew: RequestHandler = async (req, res) => {
  try {
    // 1️⃣ Get signature header
    const signature = String(req.headers["authorization"] || "").trim();
    if (!signature) {
      res.status(401).json({ resp_code: 1, resp_msg: "Missing signature" });
      return;
    }

    // 2️⃣ Capture raw body
    const rawBody = (req as any).rawBody;
    if (!rawBody) {
      res.status(400).json({ resp_code: 1, resp_msg: "Missing raw body" });
      return;
    }

    // 3️⃣ Load config
    const config = getEnvConfigNew();

    // 4️⃣ Verify signature directly using raw string (NO normalization)
    const isValid = verifyNew(rawBody, signature, config.moonton_publicKey);
    if (!isValid) {
      res.status(401).json({ resp_code: 1, resp_msg: "Invalid signature" });
      return;
    }

    // 5️⃣ Parse once AFTER signature verification
    const parsedData = JSON.parse(rawBody);

    // 6️⃣ Merchant ID validation
    // if (parsedData.merchant_id !== config.allowedMerchantId) {
    //   res.status(403).json({
    //     resp_code: 1,
    //     resp_msg: `Merchant ID ${parsedData.merchant_id} not allowed in ${config.env} environment.`
    //   });
    //   return;
    // }

    // 7️⃣ Validate required fields
    if (!parsedData.merchant_id) {
      res.status(400).json({ resp_code: 1, resp_msg: "Missing required field: merchant_id" });
      return;
    }
    if (!parsedData.merchant_order_id && !parsedData.invoice_id) {
      res.status(400).json({ resp_code: 1, resp_msg: "Either merchant_order_id or invoice_id must be provided" });
      return;
    }
    console.log("merchant_id from body:", JSON.stringify(parsedData.merchant_id));
    console.log("allowedMerchantId:", JSON.stringify(config.allowedMerchantId));

    // 8️⃣ Call service with parsed data
    const result = await moontonService.queryOrderNew(parsedData);

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ resp_code: 1, resp_msg: error.message || "Failed" });
  }
};


export const paymentCallbackNew: RequestHandler = async (req, res) => {
  try {
    // 1️⃣ Capture signature from header
    let signature = String(req.headers["authorization"] || "").replace(/(\r\n|\n|\r)/gm, "").trim();
    if (!signature) {
      res.status(401).json({ code: 1, message: "Missing signature" });
      return;
    }

    // 2️⃣ Capture raw body
    const rawBody = (req as any).rawBody;
    if (!rawBody) {
      res.status(400).json({ code: 1, message: "Missing raw body" });
      return;
    }

    // 3️⃣ Load environment configuration
    const config = getEnvConfigNew();

    // 4️⃣ Verify signature using raw string only (NO normalization)
    const isValid = verifyNew(rawBody, signature, config.publicKey);
    if (!isValid) {
      res.status(401).json({ code: 1, message: "Invalid signature" });
      return;
    }

    // 5️⃣ Parse once AFTER signature verification
    const parsedData = JSON.parse(rawBody);

    // 6️⃣ Merchant validation
    const merchantId = (parsedData.merchant_id || "").trim();
    if (!merchantId) {
      res.status(400).json({ code: 1, message: "Merchant ID is required" });
      return;
    }

    if (merchantId !== config.allowedMerchantId) {
      res.status(403).json({
        code: 1,
        message: `Merchant ID ${merchantId} not allowed in ${config.env} environment.`,
      });
      return;
    }

    // 7️⃣ Check merchant record
    const merchant = await prisma.merchant.findFirst({ where: { uid: merchantId } });
    if (!merchant) {
      res.status(404).json({ code: 1, message: "Invalid merchantId" });
      return;
    }

    // 8️⃣ Handle callback logic (DB update etc.)
    const result = await moontonService.handleCallbackNew(parsedData, req.headers);

    if (result.success) {
      // Fetch updated order
      const order = await prisma.paymentOrderNew.findUnique({
        where: { invoiceId: parsedData.invoice_id },
      });

      if (order && order.notifyUrl) {
        const callbackPayload = {
          amount: order.amount,
          merchant_order_id: parsedData.merchant_order_id,
          invoice_id: parsedData.invoice_id,
          currency: parsedData.currency,
          merchant_id: parsedData.merchant_id,
          status: parsedData.status,
          success_time: parsedData.success_time,
        };
        // send callback to Moonton notify_url (transactionService should handle retries)
        await transactionService.sendCallbackMoonton(
          order.notifyUrl || merchant?.webhook_url as string,
          callbackPayload,
          "", // msisdn not used here
          "payin",
          merchant.encrypted === "True",
          false
        );
      }


      res.status(200).json({ code: 0, message: "success" });
    } else {
      res.status(500).json({ code: 1, message: "notify failed." });
    }
  } catch (err: any) {
    res.status(500).json({ code: 1, message: err?.message || "callback handling error" });
  }
};

export default {

  createPaymentOrderNew,
  queryPaymentOrderNew,
  paymentCallbackNew
}