import { NextFunction, Request, Response } from "express";
import jazzcashDisburse from "../../services/paymentGateway/jazzcashDisburse.js";
import ApiResponse from "../../utils/ApiResponse.js";

const addDisburseAccount = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const result = await jazzcashDisburse.addDisburseAccount(req.body);
         res.status(200).json(ApiResponse.success(result));
    } catch (error) {
        next(error);
    }
};

const getDisburseAccount = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const result = await jazzcashDisburse.getDisburseAccount(
            req.params.accountId as (string | number)
        );
         res.status(200).json(ApiResponse.success(result));
    } catch (error) {
        next(error);
    }
};

const updateDisburseAccount = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const result = await jazzcashDisburse.updateDisburseAccount(
            req.params.accountId as string,
            req.body
        );
         res.status(200).json(ApiResponse.success(result));
    } catch (error) {
        next(error);
    }
};

const deleteDisburseAccount = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const result = await jazzcashDisburse.deleteDisburseAccount(
            req.params.accountId as string
        );
         res.status(200).json(ApiResponse.success(result));
    } catch (error) {
        next(error);
    }
};

export default {
    addDisburseAccount,
    getDisburseAccount,
    updateDisburseAccount,
    deleteDisburseAccount,
};