import { bankIslamiController } from "../../controller/index.js";
import { Router } from "express";
import { apiKeyAuth, validateMerchantIp } from "../../middleware/auth.js";

export default function (router: Router) {
    router.post("/qr/:merchantId",
        [apiKeyAuth, validateMerchantIp],
        bankIslamiController.initiateBankIslami
    )
}
