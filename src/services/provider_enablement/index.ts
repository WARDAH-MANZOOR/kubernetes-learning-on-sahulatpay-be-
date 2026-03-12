import { CashierMode } from "@prisma/client";
import prisma from "../../prisma/client.js";
import CustomError from "../../utils/custom_error.js";

interface UpdateProviderStatusDTO {
    mode: string;
    jazzCash?: boolean;
    easypaisa?: boolean;
    card?: boolean;
    qr?: boolean;
}

interface GetProviderStatusDTO {
    mode?: string | string[];
}

const parseMode = (rawMode: unknown): CashierMode => {
    if (typeof rawMode !== "string" || !rawMode.trim()) {
        throw new CustomError("Mode is required", 400);
    }

    const mode = rawMode.toLowerCase();
    if (!Object.values(CashierMode).includes(mode as CashierMode)) {
        throw new CustomError("Invalid mode", 400);
    }

    return mode as CashierMode;
};

const getProviderEnabledStatus = async (
    params: GetProviderStatusDTO
) => {
    const rawMode = Array.isArray(params?.mode) ? params?.mode[0] : params?.mode;

    if (!rawMode) {
        return prisma.providerEnabledStatus.findMany({
            orderBy: { id: "asc" },
        });
    }

    const mode = parseMode(rawMode);
    return prisma.providerEnabledStatus.findUnique({
        where: { mode },
    });
};

const updateProviderEnabledStatus = async (
    payload: UpdateProviderStatusDTO
) => {
    const mode = parseMode(payload?.mode);
    const { jazzCash, easypaisa, card, qr } = payload;

    // Build dynamic update object (only defined fields)
    const updateData: any = {};

    if (typeof jazzCash !== "undefined") {
        updateData.jazzCash = jazzCash;
    }

    if (typeof easypaisa !== "undefined") {
        updateData.easypaisa = easypaisa;
    }

    if (typeof card !== "undefined") {
        updateData.card = card;
    }

    if (typeof qr !== "undefined") {
        updateData.qr = qr;
    }

    if (Object.keys(updateData).length === 0) {
        throw new CustomError("No fields provided for update", 400);
    }

    const updatedRecord = await prisma.providerEnabledStatus.upsert({
        where: { mode },
        update: updateData,
        create: {
            mode,
            ...updateData,
        },
    });

    return updatedRecord;
};

export default {
    getProviderEnabledStatus,
    updateProviderEnabledStatus
}
