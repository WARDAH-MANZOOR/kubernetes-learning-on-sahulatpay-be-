import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import prisma from "../../prisma/client.js";
import { bankIslamiService } from "../../services/index.js";
import ApiResponse from "../../utils/ApiResponse.js";

const initiateBankIslami = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        let merchantId = req.params?.merchantId as string;

        if (!merchantId) {
            res.status(400).json(ApiResponse.error("Merchant ID is required"));
            return;
        }


        let result = await bankIslamiService.initiateBankIslami(
            merchantId,
            req.body
        );
        if (result.statusCode != "00") {
            await prisma.failedAttempt.create({ data: { phoneNumber: req.body.phone } });
            res.status(result.statusCode != 500 ? result.statusCode : 500).send(ApiResponse.error(result.message, result.statusCode != 500 ? result.statusCode : 500))
            return;
        }

        res.status(200).json(ApiResponse.success(result));
    } catch (error) {
        next(error);
    }
};

export default {initiateBankIslami}