import { provider_enablement } from "../../controller/index.js";
import express from "express"
import { isAdmin, isLoggedIn } from "../../utils/middleware.js";

const router = express.Router();

router.get("/",
    provider_enablement.getProviderStatus)

router.put("/", 
    [isLoggedIn, isAdmin], 
    provider_enablement.updateProviderStatus)

export default router;
