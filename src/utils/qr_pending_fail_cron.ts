import prisma from "../prisma/client.js";

const failOldQrTransactions = async (): Promise<void> => {
  try {
    console.log("QR Pending Fail Cron Started");

    // current time se 4 ghantay pehle ka time
    const fourHoursAgo = new Date(
      Date.now() - 4 * 60 * 60 * 1000 // 4 hours
        //  Date.now() - 3 * 60 * 1000 // for testing purpose only(3 minutes)
    );

    // const transactions = await prisma.transaction.findMany({
    //   where: {
    //     status: "pending",
    //     createdAt: {
    //       lte: fourHoursAgo,
    //     },
    //     // JSON column filter (QR transactions)
    //     providerDetails: {
    //       path: ["name"],
    //       equals: "QR",
    //     },
    //   },
    //   orderBy: {
    //     date_time: 'desc'
    //   }
    // })
    const result = await prisma.transaction.updateMany({
      where: {
        status: "pending",
        createdAt: {
          lte: fourHoursAgo,
        },
        // JSON column filter (QR transactions)
        providerDetails: {
          path: ["name"],
          equals: "QR",
        },
      },
      data: {
        status: "failed",
        response_message: "failed"
      },
    });

    console.log(`Failed QR Transactions Count: ${result.count}`);
  } catch (error: unknown) {
    console.error("QR Pending Fail Cron Error:", error);
  }
};

export default failOldQrTransactions;
