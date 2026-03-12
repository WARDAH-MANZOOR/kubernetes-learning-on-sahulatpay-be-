import { NextFunction, Request, Response } from "express";
import { bill1Service } from "../../services/index.js";
import ApiResponse from "../../utils/ApiResponse.js";

const getBill1Config = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await bill1Service.getBill1Config(req.query as any);
    res.status(200).json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
};

const createBill1Config = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await bill1Service.createBill1Config(req.body);
    res.status(200).json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
};

const updateBill1Config = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json(ApiResponse.error("id must be a positive integer"));
      return;
    }

    const result = await bill1Service.updateBill1Config(id, req.body);
    res.status(200).json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
};

const deleteBill1Config = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json(ApiResponse.error("id must be a positive integer"));
      return;
    }

    const result = await bill1Service.deleteBill1Config(id);
    res.status(200).json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
};

export default {
  getBill1Config,
  createBill1Config,
  updateBill1Config,
  deleteBill1Config,
};
