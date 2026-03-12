import axios from "axios";
import { PROVIDERS } from "../../constants/providers.js";
import prisma from "../../prisma/client.js";
import { transactionService } from "../../services/index.js";
import CustomError from "../../utils/custom_error.js";

const initiateBankIslami = async (merchantId: string, params: any) => {
    let saveTxn: any;
    let id = transactionService.createTransactionId();
    let reservations: string[] = [];

    try {
        console.log(
            JSON.stringify({
                event: "BANKISLAMI_PAYIN_INITIATED",
                order_id: params.order_id,
                system_id: id,
                body: params,
            })
        );

        if (!merchantId) throw new CustomError("Merchant ID is required", 400);

        const findMerchant = await prisma.merchant.findFirst({
            where: { uid: merchantId },
            include: { commissions: true },
        });

        if (!findMerchant) throw new CustomError("Merchant not found", 404);

        if (!findMerchant.qrEnabled) throw new CustomError("QR Not Enabled", 500)

        const phone = transactionService.convertPhoneNumber(params.phone);
        const id2 = params.order_id || id;

        // ✅ BankIslami API payload (based on your curl)
        const bankIslamiPayload = {
            orderId: id2,
            transactionAmount: +params.amount,
            mobileAccountNo: phone,
            emailAddress: params.email,
            merchantId: String(findMerchant.merchant_id), // your curl used "5"
        };

        // ✅ Commission calculation stays same
        let commission: number;
        if (findMerchant.commissions?.[0]?.qrRate) {
            commission =
                +findMerchant.commissions[0].commissionGST +
                +findMerchant.commissions[0].qrRate +
                +findMerchant.commissions[0].commissionWithHoldingTax;
        } else {
            commission =
                +findMerchant.commissions?.[0]?.commissionGST +
                +(findMerchant.commissions?.[0]?.commissionRate ?? 0) +
                +findMerchant.commissions?.[0]?.commissionWithHoldingTax;
        }

        // ✅ Create PENDING txn (same as your current flow)
        saveTxn = await transactionService.createTxn({
            order_id: id2,
            transaction_id: id,
            amount: params.amount,
            status: "pending",
            type: params.type,
            merchant_id: findMerchant.merchant_id,
            commission,
            settlementDuration: findMerchant.commissions[0].settlementDuration,
            providerDetails: {
                name: PROVIDERS.QR, // or PROVIDERS.BANKISLAMI if exists
                msisdn: phone,
            },
        });

        console.log(
            JSON.stringify({
                event: "PENDING_TXN_CREATED",
                order_id: id2,
                system_id: id,
            })
        );

        // ✅ Call BankIslami initiate-payment API
        const url =
            "https://easypaisa-setup-server.assanpay.com/api/bankislami/transactions/initiate-payment";

        let response;
        try {
            response = await axios.post(url, bankIslamiPayload, {
                headers: { "Content-Type": "application/json" },
                timeout: 30000,
            });
        } catch (err: any) {
            // Normalize axios error into your requested format
            const serverMsg =
                err?.response?.data?.responseMessage ||
                err?.response?.data?.error?.responseMessage ||
                "";
            throw new CustomError(serverMsg || "BankIslami initiate-payment failed", err?.response?.status || 500);
        }

        const data = response?.data;

        console.log(
            JSON.stringify({
                event: "BANKISLAMI_PAYIN_API_RESPONSE",
                order_id: id2,
                system_id: id,
                response: data,
            })
        );

        // ✅ Success: keep txn PENDING, store QR + meta, DO NOT schedule / DO NOT callback
        if (data?.success === true && data?.responseCode === "00") {
            await transactionService.updateTxn(
                saveTxn.transaction_id,
                {
                    status: "pending", // stays pending
                    response_message: data?.responseMessage ?? "Initiated",
                    providerDetails: {
                        ...(saveTxn.providerDetails ?? {}),
                        name: PROVIDERS.QR,
                        msisdn: phone,
                        transactionId: data?.traceId,
                    },
                },
                findMerchant.commissions[0].settlementDuration
            );

            // ✅ Important:
            // Do NOT commitReservations here because txn is still pending.
            // Reservations should stay until final status is known (handled elsewhere).

            return {
                txnNo: saveTxn.merchant_transaction_id,
                txnDateTime: saveTxn.date_time,
                statusCode: data?.responseCode,
                qrText: data?.qrText,
            };
        }

        // ❌ Not success => mark FAILED + cancel reservations
        await transactionService.updateTxn(
            saveTxn.transaction_id,
            {
                status: "failed",
                response_message: data?.responseMessage || "BankIslami initiation failed",
                providerDetails: {
                    ...(saveTxn.providerDetails ?? {}),
                    name: PROVIDERS.QR,
                    msisdn: phone,
                    transactionId: data?.traceId,
                },
            },
            findMerchant.commissions[0].settlementDuration
        );


        throw new CustomError(data?.responseMessage || "BankIslami initiation failed", 500);
    } catch (error: any) {
        console.log(
            JSON.stringify({
                event: "BANKISLAMI_PAYIN_ERROR",
                order_id: params.order_id,
                system_id: id,
                error: {
                    message: error?.message,
                    response: error?.response?.data || null,
                    statusCode: error?.statusCode || error?.response?.status || null,
                },
            })
        );

        // Cancel reservations only if txn is not meant to remain pending.
        // In this flow, if we fail before successful initiation, we cancel.

        return {
            message: error?.message || "An error occurred while initiating the transaction",
            statusCode: error?.statusCode || 500,
            txnNo: saveTxn?.merchant_transaction_id,
        };
    }
};

export default {initiateBankIslami}