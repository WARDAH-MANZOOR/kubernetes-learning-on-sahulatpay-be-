import { statusInquiry } from "../../controller/index.js";
import { Router } from "express";
import { validateMerchantIp } from "../../middleware/auth.js";

export default function (router: Router) {
    router.get("/all-inquiry/:merchantId", validateMerchantIp, statusInquiry.statusInquiryController)
}
