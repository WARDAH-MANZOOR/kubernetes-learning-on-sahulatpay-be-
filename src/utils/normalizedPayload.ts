export interface PaymentOrderData {
  merchant_id: string;
  merchant_order_id: string;
  country_or_region: string;
  currency: string;
  amount: string;
  payment_method: string;
  return_url: string;
  notify_url: string;
  description: string;
  user_id?: string;
  user_ip?: string;
  user_email?: string;
}

export function normalizePayload(data: PaymentOrderData) {
  const orderedData: any = {
    merchant_id: data.merchant_id,
    merchant_order_id: data.merchant_order_id,
    country_or_region: data.country_or_region,
    currency: data.currency,
    amount: data.amount,
    payment_method: data.payment_method,
    return_url: data.return_url,
    notify_url: data.notify_url,
    description: data.description,
  };

  if (data.user_id) orderedData.user_id = data.user_id;
  if (data.user_ip) orderedData.user_ip = data.user_ip;
  if (data.user_email) orderedData.user_email = data.user_email;

  return orderedData;
}


export interface CallbackData {
  amount: string;
  merchant_order_id: string;
  invoice_id: string;
  currency: string;
  merchant_id: string;
  status: string;
  success_time: string;
}

export function normalizePayloadCallback(data: CallbackData) {
  return {
    amount: data.amount,
    merchant_order_id: data.merchant_order_id,
    invoice_id: data.invoice_id,
    currency: data.currency,
    merchant_id: data.merchant_id,
    status: data.status,
    success_time: data.success_time,
  };
}
export interface QueryOrderData {
  merchant_id: string;
  merchant_order_id?: string;
  invoice_id?: string;
}

export function normalizePayloadQuery(data: QueryOrderData) {
  return {
    merchant_id: data.merchant_id,
    merchant_order_id: data.merchant_order_id || "",
    invoice_id: data.invoice_id || ""
  };
}
