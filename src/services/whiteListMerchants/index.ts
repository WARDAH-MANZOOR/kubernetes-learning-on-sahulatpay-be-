// services/whitelist.service.ts
import { Prisma, PrismaClient } from "@prisma/client";
import { generateToken } from "../../utils/whiteListMerchantsToken.js";

const prisma = new PrismaClient();

export const createWhiteListMerchant = async (merchantId: number,company_name:string, merchant_name: string) => {
  const token = generateToken(merchantId, merchant_name);
  return await prisma.whiteListMerchant.create({
    data: {
      merchantId,
      company_name,
      merchant_name,
      token
    }
  });
};
export const deleteWhiteListMerchant = async (merchantId: number) => {
  const deleted = await prisma.whiteListMerchant.deleteMany({
    where: { merchantId },
  });

  if (deleted.count === 0) {
    throw new Error(`No whitelist merchant found with merchantId: ${merchantId}`);
  }

  return { message: `Merchant with ID ${merchantId} deleted from whitelist.` };
};


// export const updateWhiteListMerchantIP = async (
//   merchantId: number,
//   newIps: string[] | string
// ) => {
//   const record = await prisma.whiteListMerchant.findUnique({
//     where: { merchantId },
//     select: { ip: true, ips: true },
//   });

//   const incomingIps = Array.isArray(newIps) ? newIps : [newIps];

//   // Ensure all entries are valid strings (and remove nulls)
//   const existingIps = Array.isArray(record?.ips)
//     ? (record.ips.filter((ip): ip is string => typeof ip === "string"))
//     : [];

//   const oldIpAsList = record?.ip ? [record.ip] : [];

//   // Merge and remove duplicates
//   const updatedIPs = Array.from(new Set([...existingIps, ...oldIpAsList, ...incomingIps]));

//   return await prisma.whiteListMerchant.update({
//     where: { merchantId },
//     data: {
//       ips: updatedIPs as Prisma.InputJsonValue, // JSON type accepted by Prisma
//     },
//   });
// };
export const updateWhiteListMerchantIP = async (
  merchantId: number,
  newIps: string[] | string
) => {
  const record = await prisma.whiteListMerchant.findUnique({
    where: { merchantId },
    select: { ips: true }, // Removed ip
  });

  const incomingIps = Array.isArray(newIps) ? newIps : [newIps];

  const existingIps = Array.isArray(record?.ips)
    ? record.ips.filter((entry): entry is string => typeof entry === "string")
    : [];

  const updatedIPs = Array.from(new Set([...existingIps, ...incomingIps]));

  return await prisma.whiteListMerchant.update({
    where: { merchantId },
    data: {
      ips: updatedIPs as Prisma.InputJsonValue,
    },
  });
};

// export const updateWhiteListMerchantIP = async (merchantId: number, newIp: string) => {
//   const record = await prisma.whiteListMerchant.findUnique({
//     where: { merchantId },
//     select: { ip: true, ips: true },
//   });

//   let updatedIPs: string[];

//   // ✅ Type guard to ensure ips is string[]
//   if (Array.isArray(record?.ips) && record.ips.every(ip => typeof ip === "string")) {
//     updatedIPs = record.ips.includes(newIp) ? record.ips : [...record.ips, newIp];
//   } else if (typeof record?.ips === "undefined" && record?.ip) {
//     updatedIPs = record.ip === newIp ? [record.ip] : [record.ip, newIp];
//   } else {
//     updatedIPs = [newIp];
//   }

//   return await prisma.whiteListMerchant.update({
//     where: { merchantId },
//     data: {
//       ips: updatedIPs as Prisma.InputJsonValue, // 👈 fix type here
//     },
//   });
// };

// export const findWhiteListMerchantByTokenAndIP = async (
//   token: string,
//   ip: string,
//   merchantId: number
// ) => {
//   return prisma.whiteListMerchant.findFirst({
//     where: {
//       token,
//       ip,
//       merchantId,
//     },
//   });
// };
export const findWhiteListMerchantByTokenAndIP = async (
  token: string,
  ip: string,
  merchantId: number
) => {
  return prisma.whiteListMerchant.findFirst({
    where: {
      token,
      merchantId,
      ips: {
        array_contains: ip, // 👈 Check if the list contains the request IP
      },
    },
  });
};

export const findWhiteListMerchantByToken = async (
  token: string,
  merchantId: number
) => {
  return prisma.whiteListMerchant.findFirst({
    where: {
      token,
      merchantId,
    },
  });
};
// services/whitelist.service.ts

export const getAllWhiteListMerchants = async (merchantId?: number) => {
  return prisma.whiteListMerchant.findMany({
    where: merchantId ? { merchantId } : undefined,
    select: {
        id: true,
        merchantId: true,
        company_name: true,
        merchant_name: true,
        token: true,
        ips: true,
        
      }
    });
  };
// // services/whitelist.service.ts
// export const updateWhiteListMerchant = async (
//   merchantId: number,
//   data: { token?: string; ip?: string }
// ) => {
//   return await prisma.whiteListMerchant.update({
//     where: { merchantId },
//     data
//   });
// };
// export const updateWhiteListMerchant = async (
//   merchantId: number,
//   data: { token?: string; ip?: string; ips?: string[] }
// ) => {
//   const updateData: any = {};

//   if (data.token) {
//     updateData.token = data.token;
//   }

//   if (data.ips) {
//     updateData.ips = data.ips; // ✅ Save list of IPs
//   } else if (data.ip) {
//     updateData.ips = [data.ip]; // ✅ Save single IP as list
//   }

//   return await prisma.whiteListMerchant.update({
//     where: { merchantId },
//     data: updateData,
//   });
// };
export const updateWhiteListMerchant = async (
  merchantId: number,
  data: { token?: string; ips?: string[] }
) => {
  const updateData: any = {};

  if (data.token) {
    updateData.token = data.token;
  }

  if (data.ips) {
    updateData.ips = data.ips; // ✅ Save list of IPs
  }

  return await prisma.whiteListMerchant.update({
    where: { merchantId },
    data: updateData,
  });
};

export default{createWhiteListMerchant,deleteWhiteListMerchant,updateWhiteListMerchantIP,findWhiteListMerchantByTokenAndIP,findWhiteListMerchantByToken,getAllWhiteListMerchants,updateWhiteListMerchant}