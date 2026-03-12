import { $Enums, Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import prisma from "../../prisma/client.js";
import { easyPaisaService, merchantService, transactionService } from "../../services/index.js";
import CustomError from "../../utils/custom_error.js";
import { getMerchantRate, getWalletBalance } from "./disbursement.js";
import { PROVIDERS } from "../../constants/providers.js";
import axios from "axios";
import { toZonedTime } from "date-fns-tz";


function stringToBoolean(value: string): boolean {
    return value.toLowerCase() === "true";
}

const adjustMerchantToDisburseBalance = async (merchantId: string, amount: number, isIncrement: boolean) => {
    try {
        let obj;
        if (isIncrement) {
            obj = await prisma.merchant.updateMany({
                where: {
                    uid: merchantId,
                },
                data: {
                    balanceToDisburse: {
                        increment: amount
                    }
                },
            });
        } else {
            obj = await prisma.merchant.updateMany({
                where: {
                    uid: merchantId,
                },
                data: {
                    balanceToDisburse: {
                        decrement: amount
                    },
                },
            });
        }

        return {
            message: "Merchant balance updated successfully",
            obj
        };
    }
    catch (err: any) {
        throw new CustomError(err.message, 500);
    }
}

const aikPayout = async (obj: any, merchantId: string) => {
    let balanceDeducted = true;
    let findMerchant: ({ commissions: { id: number; merchant_id: number; createdAt: Date; updatedAt: Date; commissionMode: $Enums.CommissionMode | null; commissionRate: Prisma.Decimal; easypaisaRate: Prisma.Decimal | null; cardRate: Prisma.Decimal | null; commissionWithHoldingTax: Prisma.Decimal; commissionGST: Prisma.Decimal; disbursementRate: Prisma.Decimal; disbursementWithHoldingTax: Prisma.Decimal; disbursementGST: Prisma.Decimal; settlementDuration: number; }[]; } & { merchant_id: number; createdAt: Date; updatedAt: Date | null; uid: string; full_name: string; phone_number: string; company_name: string; company_url: string | null; city: string; payment_volume: string | null; user_id: number; webhook_url: string | null; callback_mode: $Enums.CallbackMode; payout_callback: string | null; jazzCashMerchantId: number | null; easyPaisaMerchantId: number | null; swichMerchantId: number | null; zindigiMerchantId: number | null; payFastMerchantId: number | null; wooMerchantId: number | null; jazzCashCardMerchantId: number | null; encrypted: string | null; balanceToDisburse: Prisma.Decimal | null; disburseBalancePercent: Prisma.Decimal; easypaisaPaymentMethod: $Enums.EasypaisaPaymentMethodEnum; easypaisaInquiryMethod: $Enums.EasypaisaInquiryMethod; payfastInquiryMethod: $Enums.EasypaisaInquiryMethod; jazzCashDisburseInquiryMethod: $Enums.EasypaisaInquiryMethod; jazzCashInquiryMethod: $Enums.EasypaisaInquiryMethod; EasyPaisaDisburseAccountId: number | null; JazzCashDisburseAccountId: number | null; easypaisaMinAmtLimit: Prisma.Decimal | null; swichLimit: Prisma.Decimal | null; lastSwich: Date; }) | null = null;
    let id;
    let merchantAmount: string | number | Decimal = new Decimal(obj.amount);
    try {
        // validate Merchant
        findMerchant = await merchantService.findOne({
            uid: merchantId,
        });

        if (!findMerchant) {
            throw new CustomError("Merchant not found", 404);
        }

        if (obj.order_id) {
            const checkOrder = await prisma.disbursement.findFirst({
                where: {
                    merchant_custom_order_id: obj.order_id,
                },
            });
            if (checkOrder) {
                throw new CustomError("Order ID already exists", 400);
            }
        }

        // Phone number validation (must start with 92)
        // if (!obj.phone.startsWith("92")) {
        //   throw new CustomError("Number should start with 92", 400);
        // }

        let amountDecimal = new Decimal(obj.amount);
        let totalCommission = new Decimal(0);
        let totalGST = new Decimal(0);
        let totalWithholdingTax = new Decimal(0);
        let totalDisbursed: number | Decimal = new Decimal(0);
        let id = transactionService.createTransactionId();
        let data2: { transaction_id?: string, merchant_custom_order_id?: string, system_order_id?: string; } = {};
        if (obj.order_id) {
            data2["merchant_custom_order_id"] = obj.order_id;
        }
        else {
            data2["merchant_custom_order_id"] = id;
        }
        // else {
        data2["system_order_id"] = id;
        await prisma.$transaction(async (tx) => {
            try {
                let rate = await getMerchantRate(tx, findMerchant?.merchant_id as number);

                // Calculate total deductions and merchant amount
                totalCommission = amountDecimal.mul(rate.disbursementRate);
                totalGST = amountDecimal.mul(rate.disbursementGST);
                totalWithholdingTax = amountDecimal.mul(
                    rate.disbursementWithHoldingTax
                );
                const totalDeductions = totalCommission
                    .plus(totalGST)
                    .plus(totalWithholdingTax);
                merchantAmount = obj.amount
                    ? amountDecimal.plus(totalDeductions)
                    : amountDecimal.minus(totalDeductions);
                if (findMerchant?.balanceToDisburse && merchantAmount.gt(findMerchant.balanceToDisburse)) {
                    throw new CustomError("Insufficient balance to disburse", 400);
                }
                const result = adjustMerchantToDisburseBalance(findMerchant?.uid as string, +merchantAmount, false);
                balanceDeducted = true;
            } catch (err) {
                if (err instanceof Prisma.PrismaClientKnownRequestError) {
                    if (err.code === 'P2034') {
                        await prisma.disbursement.create({
                            data: {
                                ...data2,
                                // transaction_id: id,
                                merchant_id: Number(findMerchant?.merchant_id as number),
                                disbursementDate: new Date(),
                                transactionAmount: amountDecimal,
                                commission: totalCommission,
                                gst: totalGST,
                                withholdingTax: totalWithholdingTax,
                                merchantAmount: obj.amount ? obj.amount : merchantAmount,
                                platform: 0,
                                account: obj.phone,
                                provider: PROVIDERS.EASYPAISA,
                                status: "pending",
                                response_message: "pending",
                                to_provider: obj.bankName,
                                providerDetails: {
                                    id: findMerchant?.JazzCashDisburseAccountId
                                }
                            },
                        });
                        throw new CustomError("Transaction is Pending", 400);
                    }
                }
                throw new CustomError("Not Enough Balance", 400);
            }
        }, {
            // isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
            isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
            maxWait: 60000,
            timeout: 60000,
        })

        let data = { "orderId": data2.merchant_custom_order_id, "amount": obj.amount, "receiverMobileNumber": obj.phone, "merchantId": JSON.stringify(findMerchant.merchant_id) };

        let config = {
            method: "post",
            maxBodyLength: Infinity,
            url: `${process.env.AIK_URL}/payout`,
            data: data,
            validateStatus: () => true
        };

        console.log(data)
        let res = await axios.request(config);
        let { walletBalance } = await getWalletBalance(findMerchant.merchant_id) as { walletBalance: number };

        if (res.data.error) {
            console.log("Response: ", res.data)
            data2["transaction_id"] = res.data.rrn || id;
            // Get the current date
            const date = new Date();

            // Define the Pakistan timezone
            const timeZone = 'Asia/Karachi';

            // Convert the date to the Pakistan timezone
            const zonedDate = toZonedTime(date, timeZone);
            console.log("Transfer Inquiry Error: ", res.data);
            await prisma.$transaction(async (tx) => {
                const result = easyPaisaService.adjustMerchantToDisburseBalance(findMerchant?.uid as string, +merchantAmount, true);
                balanceDeducted = false;
                await prisma.disbursement.create({
                    data: {
                        ...data2,
                        // transaction_id: id,
                        merchant_id: Number(findMerchant?.merchant_id as number),
                        disbursementDate: zonedDate,
                        transactionAmount: amountDecimal,
                        commission: totalCommission,
                        gst: totalGST,
                        withholdingTax: totalWithholdingTax,
                        merchantAmount: obj.amount ? obj.amount : merchantAmount,
                        platform: res.data.Fee || 0,
                        account: obj.phone,
                        provider: PROVIDERS.BANK,
                        status: "failed",
                        response_message: res.data.message,
                        providerDetails: {
                            id: findMerchant?.EasyPaisaDisburseAccountId,
                            sub_name: PROVIDERS.BANK
                        }
                    },
                })
                throw new CustomError(res?.data?.ResponseMessage, 500);
            }, {
                isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
                maxWait: 60000,
                timeout: 60000
            })
        }

        return await prisma.$transaction(
            async (tx) => {
                data2["transaction_id"] = res.data.rrn;
                // Get the current date
                const date = new Date();

                // Define the Pakistan timezone
                const timeZone = 'Asia/Karachi';

                // Convert the date to the Pakistan timezone
                const zonedDate = toZonedTime(date, timeZone);
                // Create disbursement record
                let disbursement = await tx.disbursement.create({
                    data: {
                        ...data2,
                        // transaction_id: id,
                        merchant_id: Number(findMerchant?.merchant_id as number),
                        disbursementDate: zonedDate,
                        transactionAmount: amountDecimal,
                        commission: totalCommission,
                        gst: totalGST,
                        withholdingTax: totalWithholdingTax,
                        merchantAmount: obj.amount ? obj.amount : merchantAmount,
                        platform: res.data.Fee || 0,
                        account: obj.phone,
                        provider: PROVIDERS.BANK,
                        status: "completed",
                        response_message: "success",
                        providerDetails: {
                            id: findMerchant?.EasyPaisaDisburseAccountId,
                            sub_name: PROVIDERS.BANK
                        }
                    },
                });
                let webhook_url;
                if (findMerchant?.callback_mode == "DOUBLE") {
                    webhook_url = findMerchant.payout_callback as string;
                }
                else {
                    webhook_url = findMerchant?.webhook_url as string;
                }
                transactionService.sendCallback(
                    webhook_url,
                    {
                        original_amount: obj.amount ? obj.amount : merchantAmount,
                        date_time: zonedDate,
                        merchant_transaction_id: disbursement.merchant_custom_order_id,
                        merchant_id: findMerchant?.merchant_id,
                    },
                    obj.phone,
                    "payout",
                    stringToBoolean(findMerchant?.encrypted as string),
                    false,
                    findMerchant
                );

                return {
                    message: "Disbursement created successfully",
                    merchantAmount: obj.amount
                        ? obj.amount.toString()
                        : merchantAmount.toString(),
                    order_id: disbursement.merchant_custom_order_id,
                    externalApiResponse: {
                        TransactionReference: disbursement.transaction_id,
                        TransactionStatus: "completed",
                    },
                };
            },
            {
                maxWait: 5000,
                timeout: 60000,
            }
        );
    } catch (err: any) {
        // console.log("Initiate Transaction Error", err);
        console.log(JSON.stringify({ event: "TRANSACTION_ERROR", errorMessage: err?.message, statusCode: err?.statusCode || 500, id, order_id: obj.order_id }));
        if (balanceDeducted) {
            await easyPaisaService.adjustMerchantToDisburseBalance(findMerchant?.uid as string, +merchantAmount, true);
        }
        throw new CustomError(err?.message, err?.statusCode == 202 ? 202 : 500);
    }
};

export default {
    aikPayout
}