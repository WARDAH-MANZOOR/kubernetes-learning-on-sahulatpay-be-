import { NextFunction, Request, Response } from "express";
import { easyPaisaDisburse } from "../../services/index.js";
import ApiResponse from "../../utils/ApiResponse.js";

const addDisburseAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await easyPaisaDisburse.addDisburseAccount(req.body);
     res.status(200).json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
};

const getDisburseAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await easyPaisaDisburse.getDisburseAccount(
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
): Promise<void> => {
  try {
    const result = await easyPaisaDisburse.updateDisburseAccount(
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
): Promise<void> => {
  try {
    const result = await easyPaisaDisburse.deleteDisburseAccount(
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
