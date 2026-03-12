import { NextFunction, Request, Response } from "express";
import { zindigiService } from "../../services/index.js";
import ApiResponse from "../../utils/ApiResponse.js";

const walletToWalletPaymentController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { merchantId } = req.params;
        // Step 1: Attempt to fetch the existing client secret
        let clientSecret = await zindigiService.fetchExistingClientSecret(merchantId as string);

        // Step 2: Attempt to use the client secret with the target API
        let isValid = await zindigiService.walletToWalletPayment(req.body, merchantId as string, clientSecret);

        res.status(200).json(ApiResponse.success(isValid.data));
    }
    catch (err) {
        next(err);
    }
}

const debitInquiryController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let clientSecret = await zindigiService.fetchExistingClientSecret(req.params.merchantId as string);

        // Step 2: Attempt to use the client secret with the target API
        const response = await zindigiService.debitInquiry(req.body, req.params.merchantId as string, clientSecret.clientSecret);
        res.status(200).json(ApiResponse.success(response));
    }
    catch (err) {
        next(err)
    }
}

const debitPaymentController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let clientSecret = await zindigiService.fetchExistingClientSecret(req.params.merchantId as string);

        // Step 2: Attempt to use the client secret with the target API
        const response = await zindigiService.debitPayment(req.body, req.params.merchantId as string, clientSecret.clientSecret);
        res.status(200).json(ApiResponse.success(response));
    }
    catch (err) {
        next(err)
    }
}

const transactionInquiryController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const response = await zindigiService.transactionInquiry(req.body);
        res.status(200).json(ApiResponse.success(response));
    }
    catch (err) {
        next(err);
    }
}

const getZindigiMerchant = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const merchantId = req.params.merchantId;
        const merchant = await zindigiService.getMerchant(merchantId as string);
        res.status(200).json(ApiResponse.success(merchant));
    } catch (error) {
        next(error);
    }
};

const createZindigiMerchant = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const newMerchant = await zindigiService.createMerchant(req.body);
        res.status(201).json(ApiResponse.success(newMerchant));
    } catch (error) {
        next(error);
    }
};

const updateZindigiMerchant = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const merchantId = req.params.merchantId as string;
        const updatedMerchant = await zindigiService.updateMerchant(
            merchantId,
            req.body
        );
        if (!updatedMerchant) {
            res.status(404).json(ApiResponse.error("Merchant not found"));
            return

        }
        res.status(200).json(ApiResponse.success(updatedMerchant));
    } catch (error) {
        next(error);
    }
};

const deleteZindigiMerchant = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const merchantId = req.params.merchantId as string;
        const deletedMerchant = await zindigiService.deleteMerchant(merchantId);
        if (!deletedMerchant) {
            res.status(404).json(ApiResponse.error("Merchant not found"));
            return

        }
        res
            .status(200)
            .json(ApiResponse.success({ message: "Merchant deleted successfully" }));
    } catch (error) {
        next(error);
    }
};

export default { walletToWalletPaymentController, debitInquiryController, transactionInquiryController, getZindigiMerchant, createZindigiMerchant, updateZindigiMerchant, deleteZindigiMerchant, debitPaymentController }