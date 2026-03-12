import express from 'express';
import {whitelistController} from '../../controller/index.js';
import { isAdmin, isLoggedIn } from '../../utils/middleware.js';
import axios from 'axios';
const router = express.Router();

router.post('/merchant',[isLoggedIn, isAdmin], whitelistController.createWhiteListMerchant);
router.post('/ip', [isLoggedIn, isAdmin],whitelistController.addWhiteListMerchantIP);
router.get("/", [isLoggedIn, isAdmin],whitelistController.getAllWhiteListMerchants);
router.put("/:merchantId", [isLoggedIn, isAdmin],whitelistController.updateWhiteListMerchant); 
router.delete('/:merchantId',[isLoggedIn, isAdmin],whitelistController.deleteWhiteListMerchant);

// router.get("/check-ip", (req, res) => {
//   let ip =
//     req.headers["cf-connecting-ip"]?.toString() ||
//     req.headers["x-forwarded-for"]?.toString().split(",")[0].trim() ||
//     req.socket.remoteAddress ||
//     req.ip;

//   if (ip?.startsWith("::ffff:")) ip = ip.substring(7);
//   else if (ip?.startsWith("::")) ip = ip.substring(2);

//   res.json({ detectedIP: ip, allHeaders: req.headers });
// });


router.get("/get-ip", (req, res) => {
  let ip = req.ip;

  // Remove IPv6-style prefixes if any
  if (ip?.startsWith("::ffff:")) {
    ip = ip.replace("::ffff:", "");
  } else if (ip?.startsWith("::")) {
    ip = ip.replace("::", "");
  }

  if (!ip) {
    res.status(400).json({ message: "IP not found" });
    return
  }

  res.json({ ip });
});

// router.get("/check-ip", async (req, res) => {
//   try {
//     const response = await axios.get("https://api.ipify.org?format=json");
//     res.json({
//       detectedIP: response.data.ip
//     });
//   } catch (err) {
//     res.status(500).json({ error: "Unable to fetch IP" });
//   }
// });


// router.get("/get-my-ip", (req, res) => {
//   res.send(`
//     <html><body>
//       <script>
//         async function run() {
//           // Get CLIENT REAL PUBLIC IP
//           const ipRes = await fetch("https://api.ipify.org?format=json");
//           const ipData = await ipRes.json();

//           // Show IP to user
//           document.body.innerHTML =
//             "<h2>Your REAL Public IP:</h2>" +
//             "<h1 style='color:green;'>" + ipData.ip + "</h1>"
//         }
//         run();
//       </script>
//     </body></html>
//   `);
// });
export default router;
