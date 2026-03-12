import { NextFunction, Request, Response } from "express";
import { provider_enablement } from "../../services/index.js";
import ApiResponse from "../../utils/ApiResponse.js";

const getProviderStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await provider_enablement.getProviderEnabledStatus(req.query);
        res.status(200).json(ApiResponse.success(result));
    }
    catch (err) {
        next(err)
    }
}

const updateProviderStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await provider_enablement.updateProviderEnabledStatus(req.body);
        res.status(201).json(ApiResponse.success(result));
    }
    catch (err) {
        next(err)
    }
}

export default {
    getProviderStatus,
    updateProviderStatus
}
