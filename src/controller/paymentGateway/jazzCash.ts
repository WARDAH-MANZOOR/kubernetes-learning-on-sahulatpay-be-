// src/controllers/paymentController.ts
import { Request, Response, NextFunction, RequestHandler } from "express";
import { validationResult } from "express-validator";
import { easyPaisaService, jazzCashService, transactionService } from "../../services/index.js";
import { checkTransactionStatus, getToken, initiateTransaction, simpleProductionMwTransactionClone, simpleProductionInitiateTransactionClone, initiateTransactionClone, mwTransaction, mwTransactionClone, simpleCheckTransactionStatus, simpleGetToken, simpleSandboxCheckTransactionStatus, simpleSandboxGetToken, simpleSandboxinitiateTransactionClone, simpleSandboxMwTransactionClone, getMerchantJazzCashDisburseInquiryMethod, databaseCheckTransactionStatus } from "../../services/paymentGateway/index.js";
import ApiResponse from "../../utils/ApiResponse.js";
import CustomError from "../../utils/custom_error.js";
import { mapJZtoEPB } from "../../utils/mapJZtoEPB.js";
import prisma from "../../prisma/client.js";
import aikPayout from "../../services/paymentGateway/aikPayout.js";

export const initiateJazzCashNewFlow = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const decryptedPayload = req.body.decryptedPayload;
    const merchantId = req.params?.merchantId as string;

    if (!decryptedPayload) {
      res.status(400).json(ApiResponse.error("Decrypted payload not found"));
      return;
    }
    if (!merchantId) {
      res.status(400).json(ApiResponse.error("Merchant ID is required"));
      return;
    }


    // Delegate to service
    const result: any = await jazzCashService.initiateJazzCashPayment(decryptedPayload, merchantId);

    if (result.statusCode !== "000") {
      res
        .status(result.statusCode !== 500 ? result.statusCode : 201)
        .send(ApiResponse.error(result));
      return;
    }

    res.status(200).json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
};


const initiateJazzCash = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const paymentData = req.body;
    console.log("Payment Data: ", paymentData)

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json(ApiResponse.error(errors.array()[0] as unknown as string))
      return;
    }
    let merchantId = req.params?.merchantId as string;

    if (!merchantId) {
      res.status(400).json(ApiResponse.error("Merchant ID is required"));
      return;
    }

    const result: any = await jazzCashService.initiateJazzCashPayment(paymentData, merchantId);
    if (result.statusCode != "000") {
      res.status(result.statusCode != 500 ? result.statusCode : 201).send(ApiResponse.error(result, result.statusCode != 500 ? result.statusCode : 201));
      return;
    }
    res.status(200).json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
};

const initiateJazzCashClone = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const paymentData = req.body;
    console.log("Payment Data: ", paymentData)

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json(ApiResponse.error(errors.array()[0] as unknown as string))
      return;
    }
    let merchantId = req.params?.merchantId as string;

    if (!merchantId) {
      res.status(400).json(ApiResponse.error("Merchant ID is required"));
      return;
    }

    const result: any = await jazzCashService.initiateJazzCashPaymentClone(paymentData, merchantId);
    if (result.statusCode != "000") {
      res.status(result.statusCode != 500 ? result.statusCode : 201).send(ApiResponse.error(result, result.statusCode != 500 ? result.statusCode : 201));
      return;
    }
    res.status(200).json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
};

const initiateSandboxJazzCash = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const paymentData = req.body;
    console.log("Payment Data: ", paymentData)

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json(ApiResponse.error(errors.array()[0] as unknown as string))
      return;
    }
    let merchantId = req.params?.merchantId as string;

    if (!merchantId) {
      res.status(400).json(ApiResponse.error("Merchant ID is required"));
      return;
    }

    const result: any = await jazzCashService.initiateSandboxJazzCashPayment(paymentData, merchantId);
    if (result.statusCode != "000") {
      res.status(result.statusCode != 500 ? result.statusCode : 201).send(ApiResponse.error(result, result.statusCode != 500 ? result.statusCode : 201));
      return;
    }
    res.status(200).json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
};


const initiateProductionJazzCash = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const paymentData = req.body;
    console.log("Payment Data: ", paymentData)

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json(ApiResponse.error(errors.array()[0] as unknown as string))
      return;
    }
    let merchantId = req.params?.merchantId as string;

    if (!merchantId) {
      res.status(400).json(ApiResponse.error("Merchant ID is required"));
      return;
    }

    const result: any = await jazzCashService.initiateProductionJazzCashPayment(paymentData, merchantId);
    if (result.statusCode != "000") {
      res.status(result.statusCode != 500 ? 500 : 201).send(ApiResponse.error(result, result.statusCode != 500 ? result.statusCode : 201));
      return;
    }
    res.status(200).json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
};


const initiateJazzCashAsync = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json(ApiResponse.error(errors.array()[0] as unknown as string))
      return;
    }
    const paymentData = req.body;

    let merchantId = req.params?.merchantId as string;

    if (!merchantId) {
      res.status(400).json(ApiResponse.error("Merchant ID is required"));
      return;
    }

    const result: any = await jazzCashService.initiateJazzCashPaymentAsync(paymentData, merchantId);
    if (result.statusCode != "pending") {
      res.status(result?.statusCode).send(ApiResponse.error(result));
      return

    }
    res.status(200).json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
};

const initiateJazzCashAsyncClone = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json(ApiResponse.error(errors.array()[0] as unknown as string))
      return;
    }
    const paymentData = req.body;

    let merchantId = req.params?.merchantId as string;

    if (!merchantId) {
      res.status(400).json(ApiResponse.error("Merchant ID is required"));
      return;
    }

    const result: any = await jazzCashService.initiateJazzCashPaymentAsyncClone(paymentData, merchantId);
    if (result.statusCode != "pending") {
      res.status(result?.statusCode).send(ApiResponse.error(result));
      return

    }
    res.status(200).json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
};

const getJazzCashMerchant = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {

    const query: any = req.query;
    const result = await jazzCashService.getJazzCashMerchant(query);
    res.status(200).json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
}

const createJazzCashMerchant = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json(ApiResponse.error(errors.array()[0] as unknown as string))
    }
    const merchantData = req.body;
    const result = await jazzCashService.createJazzCashMerchant(merchantData);
    res.status(200).json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
}

const updateJazzCashMerchant = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json(ApiResponse.error(errors.array()[0] as unknown as string))
      return
    }
    const merchantId = parseInt(req.params.merchantId as string);
    const updateData = req.body;

    if (!merchantId) {
      res.status(400).json(ApiResponse.error("Merchant ID is required"));
      return

    }

    const result = await jazzCashService.updateJazzCashMerchant(merchantId, updateData);
    res.status(200).json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
};

const deleteJazzCashMerchant = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const merchantId = parseInt(req.params.merchantId as string);

    if (!merchantId) {
      res.status(400).json(ApiResponse.error("Merchant ID is required"));
      return

    }

    const result = await jazzCashService.deleteJazzCashMerchant(merchantId);
    res.status(200).json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
};

const statusInquiry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const merchantId = req.params.merchantId as string;
    const payload = req.body;
    if (!merchantId) {
      res.status(400).json(ApiResponse.error("Merchant ID is required"));
      return
    }
    const inquiryChannel = await jazzCashService.getJazzCashInquiryChannel(merchantId);
    let result;
    if (inquiryChannel?.jazzCashInquiryMethod === "WALLET") {
      result = await jazzCashService.statusInquiry(payload, merchantId);
    }
    else {
      result = await jazzCashService.databaseStatusInquiry(payload, merchantId)
    }
    res.status(200).json(ApiResponse.success(result, "", 200));
  }
  catch (err) {
    next(err);
  }
};

const simpleStatusInquiry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const merchantId = req.params.merchantId as string;
    const payload = req.query;
    if (!merchantId) {
      res.status(400).json(ApiResponse.error("Merchant ID is required"));
      return
    }
    const result = await jazzCashService.simpleStatusInquiry(payload, merchantId);
    res.status(200).json(ApiResponse.success(result, "", result.statusCode == 500 ? 201 : 200));
  }
  catch (err) {
    next(err);
  }
};

const jazzStatusInquiry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log(req.params.merchantId)
    const merchantId = req.params.merchantId as string;
    const payload = req.body;
    if (!merchantId) {
      res.status(400).json(ApiResponse.error("Merchant ID is required"));
      return
    }
    console.log("Passed")
    const inquiryChannel = await jazzCashService.getJazzCashInquiryChannel(merchantId);
    let result;
    if (inquiryChannel?.jazzCashInquiryMethod === "WALLET") {
      result = await jazzCashService.statusInquiry(payload, merchantId);
    }
    else {
      result = await jazzCashService.databaseStatusInquiry(payload, merchantId)
    }
    res.status(200).json(ApiResponse.success(result, "", 200));
  }
  catch (err) {
    next(err);
  }
};
const initiateDisbursment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log("IBFT Called")
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
    // const token = await getToken(req.params.merchantId);
    const initTransaction = await initiateTransaction(req.body, req.params.merchantId as string);
    res.status(200).json(ApiResponse.success(initTransaction));
  }
  catch (err) {
    next(err)
  }
}

const initiateMWDisbursement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
    // const token = await getToken(req.params.merchantId);
    const initTransaction = await mwTransaction(req.body, req.params.merchantId as string);

    res.status(200).json(ApiResponse.success(initTransaction));
  }
  catch (err) {
    next(err)
  }
}

export const initiateMWDisbursementNewFlow: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";

    const decryptedPayload = req.body?.decryptedPayload;
    const merchantId = req.params?.merchantId;

    if (!decryptedPayload) {
      res.status(400).json(ApiResponse.error("Decrypted payload not found"));
      return;
    }

    if (!merchantId) {
      res.status(400).json(ApiResponse.error("Merchant ID is required"));
      return;
    }

    if (Number(decryptedPayload?.amount) <= 1) {
      throw new CustomError("Amount should be greater than 0", 400);
    }

    if (!decryptedPayload?.phone || typeof decryptedPayload.phone !== "string") {
      throw new CustomError("Phone is required", 400);
    }

    const initTransaction = await mwTransaction(decryptedPayload, merchantId as string);
    res.status(200).json(ApiResponse.success(initTransaction));
  } catch (err) {
    next(err);
  }
};

function isValidPhone(number: string): boolean {
  // keep digits only
  const cleaned = number.replace(/\D/g, "");

  if (cleaned.startsWith("92")) {
    // must be AT LEAST 12 digits
    return cleaned.length >= 12;
  }

  if (cleaned.startsWith("0")) {
    // must be AT LEAST 11 digits
    return cleaned.length >= 11;
  }

  // anything else is invalid
  return false;
}

const maskPhone = (phone?: string) => {
  if (!phone) return null;
  const p = String(phone);
  if (p.length <= 4) return "****";
  return `${p.slice(0, 2)}****${p.slice(-2)}`;
};

const maskIban = (iban?: string) => {
  if (!iban) return null;
  const v = String(iban);
  if (v.length <= 8) return "********";
  return `${v.slice(0, 4)}****${v.slice(-4)}`;
};

const toNum = (v: any) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
};

const initiateDisbursmentClone = async (req: Request, res: Response, next: NextFunction) => {
  const startedAt = Date.now();
  const reqId =
    (req.headers["x-request-id"] as string) ||
    (globalThis.crypto?.randomUUID?.() ?? `req_${Date.now()}_${Math.random().toString(16).slice(2)}`);

  const ctx = {
    eventSource: "IBFT",
    reqId,
    route: "initiateDisbursmentClone",
    merchantId: req.params.merchantId
  };

  try {
    console.log(JSON.stringify({
      ...ctx,
      event: "REQUEST_RECEIVED",
      method: req.method,
      path: req.originalUrl || req.url,
      bodySummary: {
        amount: req.body?.amount,
        phone: maskPhone(req.body?.phone),
        iban: maskIban(req.body?.iban)
      }
    }));

    // ---- Merchant lookup ----
    console.log(JSON.stringify({ ...ctx, event: "MERCHANT_LOOKUP_START" }));

    const merchant = await prisma.merchant.findFirst({
      where: { uid: req.params.merchantId as string },
      select: { isEasyPaisaIBFTEnabled: true }
    });

    console.log(JSON.stringify({
      ...ctx,
      event: "MERCHANT_LOOKUP_RESULT",
      found: !!merchant,
      isEasyPaisaIBFTEnabled: merchant?.isEasyPaisaIBFTEnabled ?? null
    }));

    if (!merchant) {
      console.error(JSON.stringify({ ...ctx, event: "MERCHANT_NOT_FOUND" }));
      throw new CustomError("Merchant not found", 404);
    }

    const isEPEnabled = merchant.isEasyPaisaIBFTEnabled === true;

    // ---------- DECISION POINT ----------
    console.log(JSON.stringify({
      ...ctx,
      event: "FLOW_DECISION",
      chosenFlow: isEPEnabled ? "EASYPAISA_BANK" : "JAZZCASH"
    }));

    // ---------- EASYPAISA BANK FLOW ----------
    if (isEPEnabled) {
      console.log(JSON.stringify({ ...ctx, event: "EPB_FLOW_START" }));

      const amount = toNum(req.body?.amount);
      if (!Number.isFinite(amount) || amount <= 1) {
        console.warn(JSON.stringify({
          ...ctx,
          event: "VALIDATION_FAILED",
          flow: "EASYPAISA_BANK",
          field: "amount",
          value: req.body?.amount
        }));
        throw new CustomError("Amount should be greater than 0", 400);
      }

      if (!req.body?.phone) {
        console.warn(JSON.stringify({
          ...ctx,
          event: "VALIDATION_FAILED",
          flow: "EASYPAISA_BANK",
          field: "phone"
        }));
        throw new CustomError("Phone is required for EasyPaisa Bank disbursement", 400);
      }

      console.log(JSON.stringify({
        ...ctx,
        event: "EPB_VALIDATION_PASSED",
        amount,
        phone: maskPhone(req.body?.phone)
      }));

      // Map JazzCash payload to EPB payload
      console.log(JSON.stringify({ ...ctx, event: "MAP_JZ_TO_EPB_START" }));
      const epbPayload = mapJZtoEPB(req.body);

      console.log(JSON.stringify({
        ...ctx,
        event: "MAP_JZ_TO_EPB_DONE",
        epbPayloadSummary: {
          // keep this minimal; adjust fields based on your payload
          amount: epbPayload?.amount ?? null,
          phone: maskPhone(epbPayload?.phone)
        }
      }));

      console.log(JSON.stringify({ ...ctx, event: "EPB_DISBURSE_START" }));

      let result;
      if (epbPayload.bankCode == "59") {
        result = await easyPaisaService.createDisbursementClone(
          {amount: epbPayload.amount, phone: epbPayload.accountNo, order_id: epbPayload.order_id},
          req.params.merchantId as string
        )
      }
      else if (epbPayload.bankCode == "1010") {
        result = await aikPayout.aikPayout(
          {amount: epbPayload.amount, phone: epbPayload.accountNo, order_id: epbPayload.order_id},
          req.params.merchantId as string
        )
      }
      else {
        result = await easyPaisaService.disburseThroughBankClone(
          epbPayload,
          req.params.merchantId as string
        );
      }

      console.log(JSON.stringify({
        ...ctx,
        event: "EPB_DISBURSE_SUCCESS",
        durationMs: Date.now() - startedAt
      }));

      return res.status(200).json(ApiResponse.success(result));
    }

    // ---------- NORMAL JAZZ FLOW ----------
    console.log(JSON.stringify({ ...ctx, event: "JAZZ_FLOW_START" }));

    // ⚠️ Logging this because it’s risky in production
    console.warn(JSON.stringify({
      ...ctx,
      event: "TLS_VERIFICATION_DISABLED",
      note: "NODE_TLS_REJECT_UNAUTHORIZED is set to 0 (not recommended for production)"
    }));
    process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";

    const amount = toNum(req.body?.amount);
    if (!Number.isFinite(amount) || amount <= 1) {
      console.warn(JSON.stringify({
        ...ctx,
        event: "VALIDATION_FAILED",
        flow: "JAZZCASH",
        field: "amount",
        value: req.body?.amount
      }));
      throw new CustomError("Amount should be greater than 0", 400);
    }

    if (!req.body?.iban || String(req.body.iban).length < 10) {
      console.warn(JSON.stringify({
        ...ctx,
        event: "VALIDATION_FAILED",
        flow: "JAZZCASH",
        field: "iban",
        iban: maskIban(req.body?.iban)
      }));
      throw new CustomError("IBAN should be at least 10 digits", 400);
    }

    if (!isValidPhone(req.body?.phone)) {
      console.warn(JSON.stringify({
        ...ctx,
        event: "VALIDATION_FAILED",
        flow: "JAZZCASH",
        field: "phone",
        phone: maskPhone(req.body?.phone)
      }));
      throw new CustomError("Invalid Phone Number", 400);
    }

    console.log(JSON.stringify({
      ...ctx,
      event: "JAZZ_VALIDATION_PASSED",
      amount,
      phone: maskPhone(req.body?.phone),
      iban: maskIban(req.body?.iban)
    }));

    console.log(JSON.stringify({ ...ctx, event: "GET_TOKEN_START" }));
    // const token = await getToken(req.params.merchantId);
    console.log(JSON.stringify({
      ...ctx,
      event: "GET_TOKEN_SUCCESS",
    }));

    console.log(JSON.stringify({ ...ctx, event: "INITIATE_TRANSACTION_START" }));
    const initTransaction = await initiateTransaction(
      req.body,
      req.params.merchantId as string
    );

    console.log(JSON.stringify({
      ...ctx,
      event: "INITIATE_TRANSACTION_SUCCESS",
      durationMs: Date.now() - startedAt
    }));

    return res.status(200).json(ApiResponse.success(initTransaction));
  } catch (err: any) {
    console.error(JSON.stringify({
      ...ctx,
      event: "REQUEST_FAILED",
      durationMs: Date.now() - startedAt,
      errorMessage: err?.message,
      errorName: err?.name,
      stack: err?.stack
    }));
    next(err);
  }
};

export const initiateDisbursmentCloneNewFlow: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("IBFT ENCRYPTED Called");
    process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";

    // 🔐 decrypted payload (same as pay-in new flow)
    const decryptedPayload = req.body.decryptedPayload;
    const merchantId = req.params.merchantId as string;

    if (!decryptedPayload) {
      res.status(400).json(ApiResponse.error("Decrypted payload not found"));
      return;
    }

    if (!merchantId) {
      res.status(400).json(ApiResponse.error("Merchant ID is required"));
      return;
    }

    const { amount, iban, phone } = decryptedPayload;

    // ✅ validations (AFTER decryption)
    if (Number(amount) <= 1) {
      throw new CustomError("Amount should be greater than 0", 400);
    }

    if (!iban || iban.length < 10) {
      throw new CustomError("IBAN should be at least 10 digits", 400);
    }

    if (!isValidPhone(phone)) {
      throw new CustomError("Invalid Phone Number", 400);
    }

    // 🔑 token
    const token = await getToken(merchantId);
    if (!token || !token.access_token) {
      throw new CustomError("Unable to retrieve token", 500);
    }

    // 🚀 SAME service, SAME logic
    const initTransaction = await initiateTransactionClone(
      token.access_token,
      decryptedPayload,   // 👈 IMPORTANT
      merchantId
    );

    res.status(200).json(ApiResponse.success(initTransaction));
  } catch (err) {
    next(err);
  }
};

const initiateSandboxDisbursmentClone = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log("IBFT Called")
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
    const token = await simpleSandboxGetToken(req.params.merchantId as string);
    if (!token?.access_token) {
      res.status(500).json(ApiResponse.error(token))
    }
    const initTransaction = await simpleSandboxinitiateTransactionClone(token?.access_token, req.body, req.params.merchantId as string);
    res.status(200).json(ApiResponse.success(initTransaction));
  }
  catch (err) {
    next(err)
  }
}

const initiateProductionDisbursmentClone = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log("IBFT Called")
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
    const token = await getToken(req.params.merchantId as string);
    if (!token?.access_token) {
      res.status(500).json(ApiResponse.error(token))
    }
    const initTransaction = await simpleProductionInitiateTransactionClone(token?.access_token, req.body, req.params.merchantId as string);
    res.status(200).json(ApiResponse.success(initTransaction));
  }
  catch (err) {
    next(err)
  }
}

const initiateMWDisbursementClone = async (req: Request, res: Response, next: NextFunction) => {
  try {
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
    if (req.body.amount <= 1) {
      throw new CustomError("Amount should be greater than 0", 400);
    }
    const token = await getToken(req.params.merchantId as string);
    const initTransaction = await mwTransactionClone(token?.access_token, req.body, req.params.merchantId as string);

    res.status(200).json(ApiResponse.success(initTransaction));
  }
  catch (err) {
    next(err)
  }
}

const initiateSandboxMWDisbursementClone = async (req: Request, res: Response, next: NextFunction) => {
  try {
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
    const token = await simpleSandboxGetToken(req.params.merchantId as string);
    if (!token?.access_token) {
      res.status(500).json(ApiResponse.error(token));
    }
    const initTransaction = await simpleSandboxMwTransactionClone(token?.access_token, req.body, req.params.merchantId as string);

    res.status(200).json(ApiResponse.success(initTransaction));
  }
  catch (err) {
    next(err)
  }
}

const initiateProductionMWDisbursementClone = async (req: Request, res: Response, next: NextFunction) => {
  try {
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
    const token = await getToken(req.params.merchantId as string);
    if (!token?.access_token) {
      res.status(500).json(ApiResponse.error(token));
    }
    const initTransaction = await simpleProductionMwTransactionClone(token?.access_token, req.body, req.params.merchantId as string);

    res.status(200).json(ApiResponse.success(initTransaction));
  }
  catch (err) {
    next(err)
  }
}

const dummyCallback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await jazzCashService.callback(req.body);
    res.status(200).send(result);
  }
  catch (err) {
    next(err);
  }
}

const disburseInquiryController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
    const jazzcashDisburseInquiryMethod = await getMerchantJazzCashDisburseInquiryMethod(req.params.merchantId as string);
    let inquiry;
    if (jazzcashDisburseInquiryMethod == "WALLET") {
      const token = await getToken(req.params.merchantId as string);
      inquiry = await checkTransactionStatus(token?.access_token, req.body, req.params.merchantId as string);
    }
    else if (jazzcashDisburseInquiryMethod == "DATABASE") {
      inquiry = await databaseCheckTransactionStatus(req.body, req.params.merchantId as string)
    }
    res.status(200).json(ApiResponse.success(inquiry));
  }
  catch (err) {
    next(err)
  }
}

const simpleDisburseInquiryController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
    const token = await simpleGetToken(req.params.merchantId as string);
    const inquiry = await simpleCheckTransactionStatus(token?.access_token, req.body, req.params.merchantId as string);

    res.status(200).json(ApiResponse.success(inquiry));
  }
  catch (err) {
    next(err)
  }
}

const simpleSandboxDisburseInquiryController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
    const token = await simpleSandboxGetToken(req.params.merchantId as string);
    const inquiry = await simpleSandboxCheckTransactionStatus(token?.access_token, req.body, req.params.merchantId as string);
    res.status(200).json(ApiResponse.success(inquiry));
  }
  catch (err) {
    next(err)
  }
}

const initiateJazzCashCnic = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const paymentData = req.body;
    console.log("Payment Data: ", paymentData)

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json(ApiResponse.error(errors.array()[0] as unknown as string))
      return;
    }
    let merchantId = req.params?.merchantId as string;

    if (!merchantId) {
      res.status(400).json(ApiResponse.error("Merchant ID is required"));
      return;
    }

    const result: any = await jazzCashService.initiateJazzCashCnicPayment(paymentData, merchantId);
    if (result.statusCode != "000") {
      res.status(result.statusCode != 500 ? +result.statusCode : 201).send(ApiResponse.error(result, result.statusCode != 500 ? +result.statusCode : 201));
      return;
    }
    res.status(200).json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
};

export default {
  initiateJazzCash,
  initiateJazzCashNewFlow,
  getJazzCashMerchant,
  createJazzCashMerchant,
  updateJazzCashMerchant,
  deleteJazzCashMerchant,
  statusInquiry,
  initiateDisbursment,
  initiateMWDisbursement,
  initiateMWDisbursementNewFlow,
  dummyCallback,
  disburseInquiryController,
  simpleDisburseInquiryController,
  initiateJazzCashAsync,
  initiateJazzCashAsyncClone,
  jazzStatusInquiry,
  initiateJazzCashCnic,
  initiateDisbursmentClone,
  initiateMWDisbursementClone,
  initiateSandboxMWDisbursementClone,
  initiateSandboxDisbursmentClone,
  simpleSandboxDisburseInquiryController,
  simpleStatusInquiry,
  initiateProductionMWDisbursementClone,
  initiateProductionDisbursmentClone,
  initiateSandboxJazzCash,
  initiateProductionJazzCash,
  initiateJazzCashClone,
  initiateDisbursmentCloneNewFlow
};
