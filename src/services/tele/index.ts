import prisma from "../../prisma/client.js"

const getAllWalletAccounts = async () => {
    try {
        const jazzCashMerchants = await prisma.jazzCashMerchant.findMany({
            where: {
                merchant: {
                    some: {}
                }
            },
            include: {
                merchant: {
                    select: {
                        full_name: true,
                        merchant_id: true
                    }
                },   
            }
        })
        const easyPaisaMerchants = await prisma.easyPaisaMerchant.findMany({
            where: {
                merchant: {
                    some: {}
                }
            },
            include: {
                merchant: {
                    select: {
                        full_name: true,
                        merchant_id: true
                    }
                }
            }
        })
        return {
            jazzCashMerchants,
            easyPaisaMerchants
        }
    }
    catch (err:any) {
        console.log(JSON.stringify({event: "ERROR", data: err?.message}));
        return {
            message: err?.message || "An Error Occured",
            statusCode: err?.statusCode || 500
        }
    }
}

const getAllDisburseAccounts = async () => {
    try {
        const jazzCashDisburseAccounts = await prisma.jazzCashDisburseAccount.findMany({
            where: {
                merchant: {
                    some: {}
                }
            },
            select: {
                id: true,
                merchant_of: true,
                createdAt: true,
                updatedAt: true,
                deletedAt: true,
                merchant: {
                    select: {
                        full_name: true,
                        merchant_id: true
                    }
                },
            }
        })
        const easyPaisaDisburseAccounts = await prisma.easyPaisaDisburseAccount.findMany({
            where: {
                merchant: {
                    some: {}
                }
            },
            select: {
                id: true,
                merchant_of: true,
                createdAt: true,
                updatedAt: true,
                deletedAt: true,
                merchant: {
                    select: {
                        full_name: true,
                        merchant_id: true
                    }
                }
            }
        })
        return {
            jazzCashDisburseAccounts,
            easyPaisaDisburseAccounts
        }
    }
    catch (err:any) {
        console.log(JSON.stringify({event: "ERROR", data: err?.message}));
        return {
            message: err?.message || "An Error Occured",
            statusCode: err?.statusCode || 500
        }
    }
}

const getAllDisburseAccountWithAMerchant = async () => {
    try {
        const merchants = await prisma.merchant.findMany({
            select: {
                JazzCashDisburseAccountId: true,
                EasyPaisaDisburseAccountId: true,
                merchant_id: true,
                full_name: true
            }
        })
        return merchants;
    }
    catch(err: any) {
        return {
            message: err?.message || "An Error Occured",
            statusCode: err?.statusCode || 500
        }
    }
}

const getAllWalletAccountWithAMerchant = async () => {
    try {
        const merchants = await prisma.merchant.findMany({
            select: {
                jazzCashMerchantId: true,
                easyPaisaMerchantId: true,
                merchant_id: true,
                full_name: true
            }
        })
        return merchants;
    }
    catch(err: any) {
        return {
            message: err?.message || "An Error Occured",
            statusCode: err?.statusCode || 500
        }
    }
}

export default {
    getAllWalletAccounts,
    getAllWalletAccountWithAMerchant,
    getAllDisburseAccounts,
    getAllDisburseAccountWithAMerchant
}

