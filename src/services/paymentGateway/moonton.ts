import prisma from "../../prisma/client.js";
import { paymentRequestService } from "../index.js";
import axios from "axios";

import { signNew, verifyNew} from '../../utils/signature.js';
import { getEnvConfigNew } from '../../utils/environments.js';
import {  QueryOrderData } from "../../utils/normalizedPayload.js";

const mapAssanpayStatusToMoontonStatus = (status?: string) => {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "success" || normalized === "completed" || normalized === "paid") return "success";
  if (normalized === "failed" || normalized === "close" || normalized === "closed" || normalized === "cancelled" || normalized === "canceled") return "close";
  return "init";
};

const inquireAssanpayPayinStatus = async (data: QueryOrderData) => {
  const moontonUid = process.env.MOONTON_UID;
  if (!moontonUid) return null;

  const merchantOrderId = data.merchant_order_id?.split("pay:order:")[1];
  const reference = data.invoice_id || merchantOrderId;
  if (!reference) return null;

  try {
    const response = await axios.request({
      method: "get",
      url: `https://api5.assanpay.com/api/status-inquiry/payin/${moontonUid}`,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      params: {
        ref: reference,
      },
    });

    const statusData = response?.data?.data;
    if (!statusData) return null;

    return {
      amount: String(Math.round(Number(statusData.amount || 0) * 100)),
      currency: statusData.currency || "BDT",
      invoice_id: statusData.reference || data.invoice_id || "",
      merchant_id: data.merchant_id,
      merchant_order_id: merchantOrderId ? `pay:order:${merchantOrderId}` : (data.merchant_order_id || ""),
      resp_code: 0,
      resp_msg: response?.data?.message || "Success",
      status: mapAssanpayStatusToMoontonStatus(statusData.transactionStatus),
      success_time: mapAssanpayStatusToMoontonStatus(statusData.transactionStatus) === "success" ? new Date().toISOString() : null,
    };
  } catch (error) {
    return null;
  }
};


export const createOrderNew = async (data: any, headers: any) => {
  const config = getEnvConfigNew();
  // if (data.merchant_id !== config.allowedMerchantId) throw new Error(`Merchant ID ${data.merchant_id} not allowed in ${config.env} environment.`);

  const invoiceId = `INV-${Date.now()}`;
  const merchantOrderId = (data.merchant_order_id || "").split("pay:order:")[1];
  const paymentMethod = String(Array.isArray(data.payment_method) ? data.payment_method[0] : data.payment_method || "").toLowerCase();


  const rawData = JSON.stringify(data); // assuming data was parsed JSON
  const signature = signNew(rawData, config.privateKey);
  data.amount = data.amount / 100;

  if (paymentMethod === "bkash" || paymentMethod === "nagad") {
    const assanpayResponse = await axios.request({
      method: "post",
      url: `https://api5.assanpay.com/api/cashin/direct/${process.env.MOONTON_UID}`,
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        amount: String(data.amount),
        payment_method: paymentMethod,
        order_id: merchantOrderId,
        redirect_url: data.return_url
      },
    });

    const directUrl = assanpayResponse?.data?.data?.url;
    const directReference = assanpayResponse?.data?.data?.reference;

    if (!directUrl) {
      throw new Error("Failed to initiate direct payment");
    }

    

    const merchant = await prisma.merchant.findFirst({ where: { uid: data.merchant_id } });
    if (!merchant) throw new Error("Merchant not found with provided UID");

    return { invoice_id: directReference || invoiceId, payment_url: directUrl };
  }

  // Internal payment request
  const redirectionResult = await paymentRequestService.createMoontonPaymentRequest({
    amount: JSON.stringify(data.amount),
    store_name: data.store_name,
    email: data.email || `${data.store_name}@sahulatpay.com`,
    description: data.description,
    transactionId: data.transactionId,
    dueDate: data.dueDate,
    provider: Array.isArray(data.payment_method) ? data.payment_method[0] : data.payment_method,
    order_id: merchantOrderId
  }, data.merchant_id);

  // Save order in DB
  await prisma.paymentOrderNew.create({
    data: {
      merchantId: data.merchant_id,
      merchantOrderId,
      invoiceId,
      amount: JSON.stringify(data.amount),
      currency: data.currency,
      countryOrRegion: data.country_or_region,
      paymentMethod,
      returnUrl: data.return_url,
      notifyUrl: data.notify_url,
      description: data.description,
      status: 'init',
      userId: data.user_id || null,
      userEmail: data.user_email || null,
      userIp: data.user_ip || null
    },
  });

  const merchant = await prisma.merchant.findFirst({ where: { uid: data.merchant_id } });
  if (!merchant) throw new Error("Merchant not found with provided UID");

  return { invoice_id: invoiceId, payment_url: (redirectionResult.data as any)?.completeLink || "" };
};


export const queryOrderNew = async (data: QueryOrderData) => {
  if (!data.merchant_id || (!data.merchant_order_id && !data.invoice_id)) {
    throw new Error("Missing required parameters");
  }
  const merchantOrderId = data.merchant_order_id?.split("pay:order:")[1];


  const txn = await prisma.transaction.findUnique({
    where: {
      merchant_transaction_id: merchantOrderId
    }
  })

  const order = await prisma.paymentOrderNew.findFirst({
    where: {
      merchantId: data.merchant_id,
      OR: [
        { merchantOrderId: merchantOrderId },
        { invoiceId: data.invoice_id },
      ],
    },
  });

  if (!txn) {
    const assanpayInquiry = await inquireAssanpayPayinStatus({
      merchant_id: data.merchant_id,
      merchant_order_id: merchantOrderId ? `pay:order:${merchantOrderId}` : data.merchant_order_id,
      invoice_id: data.invoice_id,
    });
    if (assanpayInquiry) return assanpayInquiry;
    return {"resp_code": 1, "resp_msg": "Order not found"};
  }

  if (!order) {
    const assanpayInquiry = await inquireAssanpayPayinStatus({
      merchant_id: data.merchant_id,
      merchant_order_id: merchantOrderId ? `pay:order:${merchantOrderId}` : data.merchant_order_id,
      invoice_id: data.invoice_id,
    });
    if (assanpayInquiry) return assanpayInquiry;
    return {"resp_code": 1, "resp_msg": "Order not found"};
  }

  return {
    amount: JSON.stringify(Number(order.amount) * 100),
    currency: order.currency,
    invoice_id: order.invoiceId,
    merchant_id: order.merchantId,
    merchant_order_id: `pay:order:${order.merchantOrderId}`,
    resp_code: 0,
    resp_msg: txn?.response_message,
    status: txn.status == "completed" ? 'success' : txn.status == 'failed' ? 'close' : 'init',
    success_time: order.successTime ? order.successTime.toISOString() : null,
  };
};

export const handleCallbackNew = async (body: any, headers: any) => {
  const config = getEnvConfigNew();

  // 1️⃣ Extract signature
  let receivedSignature = String(headers["authorization"] || "").replace(/(\r\n|\n|\r)/gm, "").trim();

  // 2️⃣ Verify using raw string (not re-stringified)
  // Controller already parsed JSON AFTER verification, so we don’t re-check here
  // If you ever call this function standalone, pass rawBody as well
  // But for this flow, verification happens in controller

  // 3️⃣ Update database
  let attempt = 0;
  const maxAttempts = 5;

  while (attempt < maxAttempts) {
    try {
      await prisma.paymentOrderNew.update({
        where: { invoiceId: body.invoice_id },
        data: {
          status: body.status.toLowerCase(),
          successTime: new Date(body.success_time),
          amount: body.amount,
        },
      });
      return { success: true };
    } catch (e) {
      attempt++;
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }

  return { success: false };
};

export default {

  createOrderNew,
  queryOrderNew,
  handleCallbackNew}


  
