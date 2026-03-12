import { Router } from "express";
import { authorize, blockPhoneMiddleware, checkOtp, isAdmin, isLoggedIn } from "../../utils/middleware.js";
import { paymentRequestController } from "../../controller/index.js";
import block_phone_number_middleware from "../../utils/block_phone_number_middleware.js";
import { decryptEncryptedQRPayload } from "../../utils/paymentRequestDecryption.js";

const router = Router();

router.post("/pre", blockPhoneMiddleware, paymentRequestController.preRequest)
router.post(
  "/pay",
  block_phone_number_middleware.blockPhoneNumberInRedirection,
  paymentRequestController.payRequestedPayment
);

router.post(
  "/pay-otp",
  [block_phone_number_middleware.blockPhoneNumberInRedirection,blockPhoneMiddleware, checkOtp ],
  paymentRequestController.payRequestedPaymentForRedirection
);

router.post(
  "/pay-up-zi",
  [block_phone_number_middleware.blockPhoneNumberInRedirection],
  paymentRequestController.payUpaisaZindigi
);
router.get("/:id", paymentRequestController.getPaymentRequestbyId);
router.get("/txn/:id", paymentRequestController.getPaymentRequestbyTxnId);

router.get("/", [isLoggedIn], authorize("Invoice Link"), paymentRequestController.getPaymentRequest);
router.post("/", [isLoggedIn], authorize("Invoice Link"), paymentRequestController.createPaymentRequest);
router.post("/:merchantId", paymentRequestController.createPaymentRequestClone);
router.post("/new/:merchantId", decryptEncryptedQRPayload, paymentRequestController.createPaymentRequestCloneNew);
router.post("/otp/:merchantId", paymentRequestController.createPaymentRequestWithOtp);
router.post("/otp-new/:merchantId", decryptEncryptedQRPayload, paymentRequestController.createPaymentRequestWithOtpNew);
router.post("/new-otp/:merchantId", paymentRequestController.createPaymentRequestWithOtpClone);
router.post("/:merchantId", paymentRequestController.createPaymentRequestClone);
router.post("/qr/:merchantId", paymentRequestController.createPaymentRequestForQR);
router.post("/qr-new/:merchantId",decryptEncryptedQRPayload, paymentRequestController.createPaymentRequestForQRNew);

// router.post("/new", [isLoggedIn], paymentRequestController.createPaymentRequest);
router.put(
  "/:paymentRequestId",
  [isLoggedIn],
  authorize("Invoice Link"),
  paymentRequestController.updatePaymentRequest
);
router.delete(
  "/:paymentRequestId",
  [isLoggedIn],
  authorize("Invoice Link"),
  paymentRequestController.deletePaymentRequest
);

export default router;
