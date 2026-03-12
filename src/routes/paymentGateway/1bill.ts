import { bill1Controller } from "../../controller/index.js";
import { Router } from "express";
import { isAdmin, isLoggedIn } from "../../utils/middleware.js";

export default function (router: Router) {
  router.get("/1bill", [isLoggedIn, isAdmin], bill1Controller.getBill1Config);
  router.post("/1bill", [isLoggedIn, isAdmin], bill1Controller.createBill1Config);
  router.put(
    "/1bill/:id",
    [isLoggedIn, isAdmin],
    bill1Controller.updateBill1Config
  );
  router.delete(
    "/1bill/:id",
    [isLoggedIn, isAdmin],
    bill1Controller.deleteBill1Config
  );
}
