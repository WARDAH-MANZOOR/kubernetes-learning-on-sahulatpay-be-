import fs from "fs"
import crypto from "crypto"

const keyPath = "./src/keys/moonton_private.pem";
const bodyPath = "./create_order.json";

const privateKey = fs.readFileSync(keyPath, "utf8");
const body = fs.readFileSync(bodyPath, "utf8");

// Debug hash to compare with server
const bodyHashHex = crypto.createHash("sha256").update(body, "utf8").digest("hex");
console.log("[CLI] SHA256(body) =", bodyHashHex);

const signature = crypto
  .sign("sha256", Buffer.from(body, "utf8"), {
    key: privateKey,
    padding: crypto.constants.RSA_PKCS1_PADDING,
  })
  .toString("base64")
  .trim();

console.log("[CLI] Signature:", signature);