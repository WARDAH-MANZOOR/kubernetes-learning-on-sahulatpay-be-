import { Prisma } from "@prisma/client";
import prisma from "../../prisma/client.js";
import CustomError from "../../utils/custom_error.js";

interface IBill1ConfigParams {
  id?: string;
  merchant_id?: string;
}

interface IBill1ConfigPayload {
  biller_code?: number | string;
}

const parsePositiveInt = (value: unknown, fieldName: string): number => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new CustomError(`${fieldName} must be a positive integer`, 400);
  }
  return parsed;
};

const handlePrismaError = (error: any): never => {
  if (error instanceof CustomError) {
    throw error;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      throw new CustomError("1Bill config already exists", 409);
    }
    if (error.code === "P2003") {
      throw new CustomError("Invalid relation data", 400);
    }
    if (error.code === "P2025") {
      const modelName = (error.meta as { modelName?: string } | undefined)?.modelName;
      if (modelName === "Merchant") {
        throw new CustomError("Merchant not found", 404);
      }
      throw new CustomError("1Bill config not found", 404);
    }
  }
  throw new CustomError(error?.message || "An error occurred", 500);
};

const getBill1Config = async (params: IBill1ConfigParams) => {
  try {
    if (typeof params?.id !== "undefined") {
      const id = parsePositiveInt(params.id, "id");
      return prisma.merchantSubBillerCode.findMany({
        where: { id },
        orderBy: { id: "asc" },
      });
    }

    if (typeof params?.merchant_id !== "undefined") {
      const merchant_id = parsePositiveInt(params.merchant_id, "merchant_id");
      const merchant = await prisma.merchant.findUnique({
        where: { merchant_id },
        select: { billerId: true },
      });

      if (!merchant) {
        throw new CustomError("Merchant not found", 404);
      }

      if (!merchant.billerId) {
        return [];
      }

      return prisma.merchantSubBillerCode.findMany({
        where: { id: merchant.billerId },
        orderBy: { id: "asc" },
      });
    }

    const bill1Config = await prisma.merchantSubBillerCode.findMany({
      orderBy: { id: "asc" },
    });

    return bill1Config;
  } catch (error: any) {
    handlePrismaError(error);
  }
};

const createBill1Config = async (payload: IBill1ConfigPayload) => {
  try {
    if (typeof payload?.biller_code === "undefined") {
      throw new CustomError("biller_code is required", 400);
    }

    const biller_code = parsePositiveInt(payload?.biller_code, "biller_code");

    const bill1Config = await prisma.merchantSubBillerCode.create({
      data: { biller_code },
    });

    return bill1Config;
  } catch (error: any) {
    handlePrismaError(error);
  }
};

const updateBill1Config = async (
  id: number,
  payload: IBill1ConfigPayload
) => {
  try {
    if (typeof payload?.biller_code === "undefined") {
      throw new CustomError("biller_code is required", 400);
    }

    const biller_code = parsePositiveInt(payload.biller_code, "biller_code");

    const bill1Config = await prisma.merchantSubBillerCode.update({
      where: { id },
      data: { biller_code },
    });

    return bill1Config;
  } catch (error: any) {
    handlePrismaError(error);
  }
};

const deleteBill1Config = async (id: number) => {
  try {
    const bill1Config = await prisma.$transaction(async (tx) => {
      await tx.merchant.updateMany({
        where: { billerId: id },
        data: { billerId: null },
      });

      return tx.merchantSubBillerCode.delete({
        where: { id },
      });
    });

    return bill1Config;
  } catch (error: any) {
    handlePrismaError(error);
  }
};

export default {
  getBill1Config,
  createBill1Config,
  updateBill1Config,
  deleteBill1Config,
};
