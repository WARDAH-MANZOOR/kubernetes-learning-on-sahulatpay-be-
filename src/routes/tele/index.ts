import { teleController } from "../../controller/index.js";
import { Router } from "express";

const router = Router();

router.get("/wallet-accounts",teleController.getAllWalletAccounts);
router.get("/wallet-accounts-merchant",teleController.getAllWalletAccountsWithMerchant)
router.get("/disburse-accounts",teleController.getAllDisburseAccounts);
router.get("/disburse-accounts-merchant",teleController.getAllDisburseAccountsWithMerchant)

export default router
