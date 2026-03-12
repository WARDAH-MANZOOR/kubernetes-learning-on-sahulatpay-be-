import { zindigiController } from "../../controller/index.js";
import { Router } from "express";
import { isAdmin, isLoggedIn } from "../../utils/middleware.js";
import { validateMerchantIp } from "../../middleware/auth.js";

export default function (router: Router) {
    router.use(
        ["/initiate-zi/:merchantId", "/initiate-zidi/:merchantId", "/initiate-zidp/:merchantId"],
        validateMerchantIp
    );

    router.post("/initiate-zi/:merchantId", zindigiController.walletToWalletPaymentController)
    router.post("/initiate-zidi/:merchantId",zindigiController.debitInquiryController)
    router.post("/initiate-zidp/:merchantId", zindigiController.debitPaymentController)
    router.post("/inquiry-zi", validateMerchantIp, zindigiController.transactionInquiryController)
    router.post(
        "/zi-merchant",
        [isLoggedIn, isAdmin],
        zindigiController.createZindigiMerchant
      );
      router.get(
        "/zi-merchant",
        [isLoggedIn, isAdmin],
        zindigiController.getZindigiMerchant
      );
      router.put(
        "/zi-merchant/:merchantId",
        [isLoggedIn, isAdmin],
        zindigiController.updateZindigiMerchant
      );
      router.delete(
        "/zi-merchant/:merchantId",
        [isLoggedIn, isAdmin],
        zindigiController.deleteZindigiMerchant
      );
    return router;
}
