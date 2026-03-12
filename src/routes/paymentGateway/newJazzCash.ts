import { newJazzCashController } from "../../controller/index.js";
import { Router } from "express";
import { validateMerchantIp } from "../../middleware/auth.js";

export default function (router: Router) {
    router.use(
        [
            "/new-initiate-jz/:merchantId",
            "/new-initiate-jzc/:merchantId",
            "/new-status-inquiry/:merchantId",
        ],
        validateMerchantIp
    );

    router.post("/new-initiate-jz/:merchantId", newJazzCashController.newInitiateJazzCash);
    router.post("/new-initiate-jzc/:merchantId", newJazzCashController.newInitiateJazzCashCnic)
    router.post("/new-status-inquiry/:merchantId", newJazzCashController.newStatusInquiry)
}
