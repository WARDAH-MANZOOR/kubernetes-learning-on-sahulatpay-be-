
// src/utils/environments.ts
import fs from 'fs';
import path from 'path';


export function getEnvConfigNew() {
  const env = process.env.NODE_ENV === 'production' ? 'prod' : 'sandbox';

  // Allowed merchant IDs based on environment
  const allowedMerchantIds: Record<string, string> = {
    // sandbox: 'ee20172e-49c3-48b4-9cf7-73091fe9853f', // replace with actual sandbox merchant ID
    // sandbox: 'ee20172e-49c3-48b4-9cf7-73091fe9853f',
    sandbox: 'ee20172e-49c3-48b4-9cf7-73091fe9853f',
    prod: 'ee20172e-49c3-48b4-9cf7-73091fe9853f' // replace with actual production merchant ID
  };

  return {
    env,
    allowedMerchantId: allowedMerchantIds[env], // merchant ID for current environment

    // ✅ Your private key to sign createOrder
    privateKey: fs.readFileSync(path.join('src', 'keys', 'moonton_private.pem'), 'utf-8'),
    moonton_publicKey: fs.readFileSync(path.join('src', 'keys', 'moonton_public.pem'), 'utf-8'),

    // ✅ PSP's public key to verify callback signatures
    publicKey: fs.readFileSync(path.join('src', 'keys', 'psp_public.pem'), 'utf-8'),
    pspPrivateKey: fs.readFileSync('./src/keys/psp_private.pem', 'utf-8')
  };
}
