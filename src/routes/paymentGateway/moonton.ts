import express, { Router } from "express";
import { moontonController } from "../../controller/index.js";
import { validateCallbackIp, validateMerchantIp } from "../../middleware/auth.js";

export default function (router: Router) {

router.post('/moonton-new/create',
    // [authenticateTokenAndIP], 
    validateMerchantIp,
    // express.raw({ type: "application/json" }),
    moontonController.createPaymentOrderNew);
router.post('/moonton-new/callback',[validateCallbackIp] , moontonController.paymentCallbackNew);
router.post('/moonton-new/query', validateMerchantIp, moontonController.queryPaymentOrderNew);

return router;
}
