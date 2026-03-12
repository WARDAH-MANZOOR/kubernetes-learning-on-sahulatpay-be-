// utils/token.utils.ts
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!;
const ENCRYPTION_ALGO = process.env.ENCRYPTION_ALGO!;

export const generateToken = (merchantId: number, merchant_name: string): string => {
  const cipher = crypto.createCipheriv(
    ENCRYPTION_ALGO,
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    Buffer.alloc(16, 0)
  );

  let encrypted = cipher.update(`${merchantId}:${merchant_name}`, 'utf-8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};
