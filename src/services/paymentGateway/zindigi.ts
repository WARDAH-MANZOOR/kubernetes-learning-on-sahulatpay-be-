import axios from "axios";
import prisma from "../../prisma/client.js";
import { transactionService } from "../../services/index.js";
import { IZindigiPayload } from "../../types/merchant.js";
import CustomError from "../../utils/custom_error.js";
import { decrypt, decryptAny, encrypt, encryptV2 } from "../../utils/enc_dec.js";
import { Decimal, JsonObject } from "@prisma/client/runtime/library";
import { PROVIDERS } from "../../constants/providers.js";
import { addWeekdays } from "../../utils/date_method.js";
import crypto from "crypto"
import RSAEncryption from "../../utils/RSAEncryption.js";


async function fetchExistingClientSecret(merchantId: string) {
    const merchant = await prisma.merchant.findFirst({
        where: {
            uid: merchantId as string
        }
    })

    if (merchant?.uid != merchantId || merchant.zindigiMerchantId == null) {
        throw new Error("Merchant Not Found")
    }

    const zindigiMerchant = await prisma.zindigiMerchant.findUnique({
        where: {
            id: merchant.zindigiMerchantId
        }
    })

    if (!zindigiMerchant) {
        throw new Error("Merchant Not Found")
    }
    const firstApiUrl = 'https://clownfish-app-rmhgo.ondigitalocean.app/zindigi/token'; // Replace with your actual API endpoint

    try {
        const response = await fetch(firstApiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'clientId': "509200T1B603i"
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch client secret. Status: ${response.status}`);
        }

        const data = await response.json();
        console.log(data)
        return {
            clientId: zindigiMerchant.clientId,
            clientSecret: data.payLoad.clientSecret,
            organizationId: data?.payLoad?.organizationId
        };
    } catch (error: any) {
        console.error('Error fetching existing client secret:', error?.message);
        throw error;
    }
}

async function generateNewClientSecret(merchantId: string) {

    const secondApiUrl = 'https://z-sandbox.jsbl.com/zconnect/client/reset-oauth-blb'; // Replace with your actual API endpoint

    try {
        const merchant = await prisma.merchant.findFirst({
            where: {
                uid: merchantId as string
            }
        })

        if (merchant?.uid != merchantId || merchant.zindigiMerchantId == null) {
            throw new Error("Merchant Not Found")
        }

        const zindigiMerchant = await prisma.zindigiMerchant.findUnique({
            where: {
                id: merchant.zindigiMerchantId
            }
        })

        if (!zindigiMerchant) {
            throw new Error("Merchant Not Found")
        }

        const response = await fetch(secondApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                "clientId": "509200T1B603i"
            },
            body: JSON.stringify({
                "clientId": "509200T1B603i"
            })
        });

        if (!response.ok) {
            throw new Error(`Failed to generate new client secret. Status: ${response.status}`);
        }

        const data = await response.json();
        console.log(data)
        return {
            clientId: zindigiMerchant.clientId,
            clientSecret: data.payLoad.clientSecret,
            organizationId: data?.payLoad?.organizationId
        };
    } catch (error: any) {
        console.error('Error generating new client secret:', error?.message);
        throw error;
    }
}


function generateUniqueSixDigitNumber(): string {
    // Get the current timestamp in milliseconds
    const timestamp = Date.now();

    // Generate a random number between 0 and 999
    const randomNumber = Math.floor(Math.random() * 1000);

    // Combine the timestamp and random number
    const combined = timestamp + randomNumber;

    // Convert the combined number to a string
    const combinedString = combined.toString();

    // Extract the last 6 digits
    const uniqueSixDigitString = combinedString.slice(-6);

    // Convert the result back to a number
    const uniqueSixDigitNumber = parseInt(uniqueSixDigitString, 10);

    return uniqueSixDigitNumber.toString();
}

const walletToWalletPayment = async (body: any, merchantId: string, clientInfo: { clientId: string; clientSecret: string; organizationId: string }) => {
    try {
        let id = generateUniqueSixDigitNumber();
        let date = transactionService.createTransactionId().slice(1, 15);
        const merchant = await prisma.merchant.findFirst({
            where: {
                uid: merchantId as string
            },
            include: {
                commissions: true
            }
        })

        if (merchant?.uid != merchantId || merchant.zindigiMerchantId == null) {
            throw new Error("Merchant Not Found")
        }
        let commission;
        if (+(merchant?.commissions[0]?.zindigiRate as Decimal) != 0) {
            commission = +merchant?.commissions[0].commissionGST +
                +(merchant.commissions[0].zindigiRate as Decimal) +
                +merchant.commissions[0].commissionWithHoldingTax
        }
        else {
            commission = +merchant?.commissions[0].commissionGST +
                +merchant.commissions[0].commissionRate +
                +merchant.commissions[0].commissionWithHoldingTax
        }
        let id2 = body.order_id || date;
        const txn = await transactionService.createTxn({
            order_id: id2,
            transaction_id: date,
            amount: body.amount,
            status: "pending",
            type: "card",
            merchant_id: merchant.merchant_id,
            commission,
            settlementDuration: merchant.commissions[0].settlementDuration,
            providerDetails: {
                id: merchant.zindigiMerchantId as number,
                name: PROVIDERS.ZINDIGI,
                msisdn: body.accountNo,
                returnUrl: body?.returnUrl
            }
        })
        console.log({
            'w2wpRequest': {
                "MerchantType": "0088",
                "TraceNo": id,
                "CompanyName": "NOVA",
                "DateTime": date,
                "TerminalId": "NOVA",
                "ReceiverMobileNumber": body?.mobile,
                "MobileNo": body?.mobile,
                "Amount": body?.amount,
                "Reserved1": "01",
                "OtpPin": "01"
            }
        })
        const response = await axios.post(
            'https://clownfish-app-rmhgo.ondigitalocean.app/zindigi/payment',
            {
                'w2wpRequest': {
                    "MerchantType": "0088",
                    "TraceNo": id,
                    "CompanyName": "NOVA",
                    "DateTime": date,
                    "TerminalId": "NOVA",
                    "ReceiverMobileNumber": "03320354357",
                    "MobileNo": body?.mobile,
                    "Amount": body?.amount,
                    "Reserved1": "01",
                    "OtpPin": "01"
                }
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    "clientId": "509200T1B603i",

                    'clientSecret': clientInfo.clientSecret,
                    'organizationId': "534"
                }
            }
        );

        if (response.data.errorcode == "0000") {
            return {
                success: false,
                data: null
            }
        }

        const status = response.data.w2wpResponse.ResponseCode == "00" ? "completed" : "failed"

        await prisma.transaction.update({
            where: {
                merchant_transaction_id: txn.merchant_transaction_id as string
            },
            data: {
                status,
                response_message: status
            }
        })

        if (status == "completed") {
            const scheduledAt = addWeekdays(new Date(), merchant?.commissions[0].settlementDuration as number)
            let scheduledTask = await prisma.scheduledTask.create({
                data: {
                    transactionId: txn?.transaction_id,
                    status: "pending",
                    scheduledAt: scheduledAt, // Assign the calculated weekday date
                    executedAt: null, // Assume executedAt is null when scheduling
                },
            });
            if (merchant && merchant.webhook_url) {
                setTimeout(async () => {
                    transactionService.sendCallback(
                        merchant?.webhook_url as string,
                        txn,
                        (txn?.providerDetails as JsonObject)?.account as string,
                        "payin",
                        merchant?.encrypted == "True" ? true : false,
                        false,
                        merchant
                    );
                }, 30000); // Delay 30 seconds to ensure all processing is complete
            }
        }
        return {
            success: status == "completed" ? true : false,
            data: response.data
        };
    }
    catch (err) {
        console.log("Zindigi Wallet to Wallet Payment Error: ", err);
        throw new CustomError("An Error has occured", 500);
    }
}

const debitInquiry = async (body: any, merchantId: string, clientSecret: string) => {
    try {
        let id = generateUniqueSixDigitNumber();
        let date = transactionService.createTransactionId().slice(1, 15);
        const merchant = await prisma.merchant.findFirst({
            where: {
                uid: merchantId as string
            },
            include: {
                commissions: true
            }
        })

        if (merchant?.uid != merchantId || merchant.zindigiMerchantId == null) {
            throw new Error("Merchant Not Found")
        }
        let commission;
        if (+(merchant?.commissions[0]?.zindigiRate as Decimal) != 0) {
            commission = +merchant?.commissions[0].commissionGST +
                +(merchant.commissions[0].zindigiRate as Decimal) +
                +merchant.commissions[0].commissionWithHoldingTax
        }
        else {
            commission = +merchant?.commissions[0].commissionGST +
                +merchant.commissions[0].commissionRate +
                +merchant.commissions[0].commissionWithHoldingTax
        }
        let id2 = body.order_id || date;
        const txn = await transactionService.createTxn({
            order_id: id2,
            transaction_id: date,
            amount: body.amount,
            status: "pending",
            type: "card",
            merchant_id: merchant.merchant_id,
            commission,
            settlementDuration: merchant.commissions[0].settlementDuration,
            providerDetails: {
                id: merchant.zindigiMerchantId as number,
                name: PROVIDERS.ZINDIGI,
                msisdn: body.accountNo,
                returnUrl: body?.returnUrl,
                transactionId: id
            }
        })
        console.log({
            "DebitInqRequest": {
                    "processingCode": "DebitInquiry",
                    "merchantType": "0088",
                    "traceNo": id,
                    "companyName": "NOVA",
                    "dateTime": date,
                    "mobileNo": body.phone,
                    "channelId": "NOVA",
                    "terminalId": "NOVA",
                    "productId": "10245185",
                    "pinType": "02",
                    "transactionAmount": body.amount,
                    "reserved1": "02",
                    "reserved2": "",
                    "reserved3": "",
                    "reserved4": "",
                    "reserved5": "",
                    "reserved6": "",
                    "reserved7": "",
                    "reserved8": "",
                    "reserved9": "",
                    "reserved10": ""
                }
        })
        const response = await axios.post(
            'https://clownfish-app-rmhgo.ondigitalocean.app/zindigi/debit/inquiry',
            {
                "DebitInqRequest": {
                    "processingCode": "DebitInquiry",
                    "merchantType": "0088",
                    "traceNo": id,
                    "companyName": "NOVA",
                    "dateTime": date,
                    "mobileNo": body.phone,
                    "channelId": "NOVA",
                    "terminalId": "NOVA",
                    "productId": "10245185",
                    "pinType": "02",
                    "transactionAmount": body.amount,
                    "reserved1": "02",
                    "reserved2": "",
                    "reserved3": "",
                    "reserved4": "",
                    "reserved5": "",
                    "reserved6": "",
                    "reserved7": "",
                    "reserved8": "",
                    "reserved9": "",
                    "reserved10": ""
                }
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    "clientId": "509200T1B603i",
                    'clientSecret': clientSecret,
                    'organizationId': "534"
                }
            }
        );
        if (response.data.errorcode == "0000") {
            return {
                success: false,
                data: null
            }
        }
        console.log(response.data)
        const status = response.data.DebitInqResponse.responseCode == "00" ? "completed" : "failed"

        if (status == 'failed') {
            await prisma.transaction.update({
                where: {
                    merchant_transaction_id: txn.merchant_transaction_id as string
                },
                data: {
                    status,
                    response_message: status
                }
            })
        }
        return {
            success: status == "completed" ? true : false,
            data: response.data
        };
    }
    catch (err) {
        console.log("Zindigi Debit Inquiry Error: ", err);
        throw new CustomError("An Error has occured", 500);
    }
}

const rsaEncrypt = async (otp: string) => {
    try {
        // Base64 encoded public key (equivalent to Python's public_key_base64)
        const publicKeyBase64 = `MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAiO1lWgkTZeDWQgXlDF8t92YLYZm/ENvCvKPJNuj9WZfGCF5RIUFaYolb/HAhoAHKxgYRUS81WFfHuMROT+B/d0cW+Ii/sqLzTfFjepExonCj1I8m4WLdBAdZCRlWLo+bdO39OpxfK14XaPmRMdb8+uTpZ0hZBhDzZDnXChCm4fgsn63ZT2VEHdHX8PgmKTViR4VXsvyZCkT60FiEix2JdLCuSGF+tPr9GQnlSDJK4vRCZl+/TD/IaIbeAFWcx0Y6kdLpUBBUHbxY8cXcsr/HfJ6/WMEBSlUCOvbZhrx41yC/182WMPppaqCDeDamDV2T+ufzrQkT1nU40gm9h7uoXwIDAQAB`;
        
        // Decode base64 to get raw key bytes (equivalent to Python's b64decode(public_key_base64))
        const keyBytes = Buffer.from(publicKeyBase64, 'base64');
        
        // Convert to PEM format (equivalent to Python's RSA.import_key())
        const pemKey = `-----BEGIN PUBLIC KEY-----\n${publicKeyBase64.match(/.{1,64}/g)?.join('\n')}\n-----END PUBLIC KEY-----`;
        const public_key = crypto.createPublicKey(pemKey);
        
        // Encode OTP to UTF-8 bytes (equivalent to Python's otp.encode("utf-8"))
        const otpBytes = Buffer.from(otp, 'utf8');
        
        // Encrypt using PKCS1_v1_5 padding (equivalent to Python's PKCS1_v1_5.new(key).encrypt())
        const encrypted = crypto.publicEncrypt(
            {
                key: public_key,
                padding: crypto.constants.RSA_PKCS1_PADDING, // PKCS1_v1_5 padding
            },
            otpBytes
        );
        
        // Return base64 encoded result (equivalent to Python's b64encode(encrypted).decode())
        const encrypted_otp = encrypted.toString('base64');
        return encrypted_otp;
    } catch (error) {
        console.error("Error:", error);
        throw error;
    }
}
const debitPayment = async (body: any, merchantId: string, clientSecret: string) => {
    try {
        let date = transactionService.createTransactionId().slice(1, 15);
        const merchant = await prisma.merchant.findFirst({
            where: {
                uid: merchantId as string
            },
            include: {
                commissions: true
            }
        })

        if (merchant?.uid != merchantId || merchant.zindigiMerchantId == null) {
            throw new Error("Merchant Not Found")
        }

        let txn = await prisma.transaction.findFirst({
            where: {
                providerDetails: {
                    path: ["transactionId"],
                    equals: body.traceNo
                }
            }
        })
        console.log(txn)
        if ((txn?.providerDetails as JsonObject)?.transactionId != body.traceNo) {
            throw new Error("Transaction Not Found")
        }
        const otp = await rsaEncrypt(body.otp)
        console.log(otp)
        const response = await axios.post(
            'https://clownfish-app-rmhgo.ondigitalocean.app/zindigi/debit/payment',
            {
                'DebitPaymentRequest': {
                    "processingCode": "DebitPayment",
                    "merchantType": "0088",
                    "traceNo": body.traceNo,
                    "companyName": "NOVA",
                    "dateTime": date,
                    "mobileNo": body.phone,
                    "channelId": "NOVA",
                    "terminalId": "NOVA",
                    "productId": "10245185",
                    "otpPin": otp,
                    "pinType": "02",
                    "transactionAmount": body.amount,
                    "reserved1": "01",
                    "reserved2": "",
                    "reserved3": "",
                    "reserved4": "",
                    "reserved5": "",
                    "reserved6": "",
                    "reserved7": "",
                    "reserved8": "",
                    "reserved9": "",
                    "reserved10": ""
                }
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    "clientId": "509200T1B603i",
                    'clientSecret': clientSecret,
                    'organizationId': "534"
                }
            }
        );
        if (response.data.errorcode == "0000") {
            return {
                success: false,
                data: null
            }
        }

        const status = response.data.DebitPaymentResponse.ResponseCode == "00" ? "completed" : "failed"

        await prisma.transaction.update({
            where: {
                merchant_transaction_id: txn?.merchant_transaction_id as string
            },
            data: {
                status,
                response_message: status
            }
        })

        if (status == "completed") {
            const scheduledAt = addWeekdays(new Date(), merchant?.commissions[0].settlementDuration as number)
            let scheduledTask = await prisma.scheduledTask.create({
                data: {
                    transactionId: txn?.transaction_id as string,
                    status: "pending",
                    scheduledAt: scheduledAt, // Assign the calculated weekday date
                    executedAt: null, // Assume executedAt is null when scheduling
                },
            });
            if (merchant && merchant.webhook_url) {
                setTimeout(async () => {
                    transactionService.sendCallback(
                        merchant?.webhook_url as string,
                        txn,
                        (txn?.providerDetails as JsonObject)?.account as string,
                        "payin",
                        merchant?.encrypted == "True" ? true : false,
                        false,
                        merchant
                    );
                }, 30000); // Delay 30 seconds to ensure all processing is complete
            }
        }

        return {
            success: status == "completed" ? true : false,
            data: response.data
        };
    }
    catch (err: any) {
        console.log("Zindigi Debit Payment Error: ", err);
        throw new CustomError("An Error has occured", 500);
    }
}

const transactionInquiry = async (body: any) => {
    try {
        let data = JSON.stringify({
            "transactionStatusReq": body
        });

        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'https://z-sandbox.jsbl.com/zconnect/api/v1/transactionStatus',
            headers: {
                'clientId': '1',
                'clientSecret': '1',
                'organizationId': '1',
                'Content-Type': 'application/json'
            },
            data: data
        };

        let response = await axios.request(config)
        return response.data;
    }
    catch (err) {
        console.log("Zindigi Transaction Status Error: ", err);
        throw new CustomError("An Error has occured", 500);
    }
}

const createMerchant = async (merchantData: IZindigiPayload) => {
    try {
        if (!merchantData) {
            throw new CustomError("Merchant data is required", 400);
        }
        console.log(merchantData)
        const zindigiMerchant = await prisma.$transaction(async (tx) => {
            return tx.zindigiMerchant.create({
                data: {
                    clientId: encryptV2(merchantData.clientId) as string,
                    clientSecret: encryptV2(merchantData.clientSecret) as string,
                    organizationId: encryptV2(merchantData.organizationId) as string
                },
            });
        });

        if (!zindigiMerchant) {
            throw new CustomError(
                "An error occurred while creating the merchant",
                500
            );
        }
        return {
            message: "Merchant created successfully",
            data: zindigiMerchant,
        };
    } catch (error: any) {
        throw new CustomError(
            error?.message || "An error occurred while creating the merchant",
            500
        );
    }
};

const getMerchant = async (merchantId: string) => {
    try {
        const where: any = {};

        if (merchantId) {
            where["id"] = parseInt(merchantId);
        }

        let merchant = await prisma.zindigiMerchant.findMany({
            where: where,
            orderBy: {
                id: "desc",
            },
        });

        merchant = merchant.map((obj) => {
            obj["clientId"] = decryptAny(obj["clientId"] as string) as string;
            obj["clientSecret"] = decryptAny(obj["clientSecret"] as string) as string;
            obj["organizationId"] = decryptAny(obj["organizationId"] as string) as string;
            return obj;
        });

        if (!merchant) {
            throw new CustomError("Merchant not found", 404);
        }

        return {
            message: "Merchant retrieved successfully",
            data: merchant,
        };
    } catch (error: any) {
        throw new CustomError(
            error?.message || "An error occurred while reading the merchant",
            500
        );
    }
};

const updateMerchant = async (merchantId: string, updateData: IZindigiPayload) => {
    try {
        if (!merchantId) {
            throw new CustomError("Merchant ID is required", 400);
        }

        if (!updateData) {
            throw new CustomError("Update data is required", 400);
        }

        // Fetch existing data for the merchant
        const existingMerchant = await prisma.zindigiMerchant.findUnique({
            where: {
                id: parseInt(merchantId),
            },
        });

        if (!existingMerchant) {
            throw new Error("Merchant not found");
        }

        const updatedMerchant = await prisma.$transaction(async (tx) => {
            return tx.zindigiMerchant.update({
                where: {
                    id: parseInt(merchantId),
                },
                data: {
                    clientId:
                        updateData.clientId != undefined
                            ? encryptV2(updateData.clientId)
                            : existingMerchant.clientId,
                    clientSecret:
                        updateData.clientSecret != undefined
                            ? encryptV2(updateData.clientSecret)
                            : existingMerchant.clientSecret,
                    organizationId:
                        updateData.organizationId != undefined
                            ? encryptV2(updateData.organizationId)
                            : existingMerchant.organizationId
                },
            });
        });

        if (!updatedMerchant) {
            throw new CustomError(
                "An error occurred while updating the merchant",
                500
            );
        }

        return {
            message: "Merchant updated successfully",
            data: updatedMerchant,
        };
    } catch (error: any) {
        console.log(error);
        throw new CustomError(
            error?.message || "An error occurred while updating the merchant",
            500
        );
    }
};

const deleteMerchant = async (merchantId: string) => {
    try {
        if (!merchantId) {
            throw new CustomError("Merchant ID is required", 400);
        }

        const deletedMerchant = await prisma.$transaction(async (tx) => {
            return tx.zindigiMerchant.delete({
                where: {
                    id: parseInt(merchantId),
                },
            });
        });

        if (!deletedMerchant) {
            throw new CustomError(
                "An error occurred while deleting the merchant",
                500
            );
        }

        return {
            message: "Merchant deleted successfully",
        };
    } catch (error: any) {
        throw new CustomError(
            error?.message || "An error occurred while deleting the merchant",
            500
        );
    }
};

export default { walletToWalletPayment, debitInquiry, debitPayment, transactionInquiry, fetchExistingClientSecret, generateNewClientSecret, createMerchant, getMerchant, updateMerchant, deleteMerchant }
export { generateUniqueSixDigitNumber }