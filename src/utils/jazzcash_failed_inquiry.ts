import { transactionService } from "../services/index.js";
import { PROVIDERS } from "../constants/providers.js"
import prisma from "../prisma/client.js"
import { addWeekdays } from "./date_method.js";
import { JsonObject } from "@prisma/client/runtime/library";

export const failedEasypaisaInquiry = async () => {
  try {
    // 1) Get PKT boundaries (converted to UTC timestamps for DB comparison)
    const BATCH_SIZE = 1000;
    const bounds = await prisma.$queryRaw<{ start_cutoff: Date; end_cutoff: Date }[]>`
      SELECT
        (
          (date_trunc('day', now() AT TIME ZONE 'Asia/Karachi') - interval '1 day')
          AT TIME ZONE 'Asia/Karachi'
        ) AS start_cutoff,
        (
          date_trunc('day', now() AT TIME ZONE 'Asia/Karachi')
          AT TIME ZONE 'Asia/Karachi'
        ) AS end_cutoff
    `.then(r => r?.[0] ?? null);

    if (!bounds?.start_cutoff || !bounds?.end_cutoff) {
      console.log("[CRON] Could not compute bounds");
      return;
    }

    const yesterday00Pkt = bounds.start_cutoff;
    const today00Pkt = bounds.end_cutoff;

    console.log("[CRON] Window:", { yesterday00Pkt, today00Pkt });

    // 2) Chunking cursor (keyset pagination)
    let cursorDate: Date | null = null;
    let cursorId: string | null = null;

    while (true) {
      const chunk = await prisma.transaction.findMany({
        where: {
          providerDetails: {
            path: ["name"],
            equals: PROVIDERS.EASYPAISA,
          },
          status: "failed",
          date_time: {
            gte: yesterday00Pkt,
            lt: today00Pkt,
          },

          // Keyset continuation:
          ...(cursorDate && cursorId
            ? {
              OR: [
                { date_time: { gt: cursorDate } },
                { date_time: cursorDate, transaction_id: { gt: cursorId } },
              ],
            }
            : {}),
        },
        orderBy: [{ date_time: "asc" }, { transaction_id: "asc" }],
        take: BATCH_SIZE,
        select: {
          transaction_id: true,
          date_time: true,
          status: true,
          providerDetails: true,
          merchant_id: true,
          merchant_transaction_id: true
          // include whatever you need for inquiry
        },
      });

      for (const tx of chunk) {
        try {
          // TODO: call inquiry API here (JazzCash status check)
          // const inquiry = await inquireJazzCash(tx);
          const status = await fetch(`https://easypaisa-setup-server.assanpay.com/api/transactions/status-inquiry?orderId=${tx.merchant_transaction_id}`)

          if (!status.ok) { continue; }
          // TODO: map inquiry => update txn
          const resp = (await status?.json())
          console.log(resp?.data?.transactionStatus)
          const mappedStatus = resp?.data?.transactionStatus == "PAID" ? "completed" : "failed"
          console.log("Mapped Status:", mappedStatus)
          await prisma.transaction.update({
            where: { transaction_id: tx.transaction_id },
            data: { status: mappedStatus },
          });
          const findMerchant = await prisma.merchant.findUnique({
            where: {
              merchant_id: tx?.merchant_id
            },
            include: {
              commissions: true
            }
          })
          const scheduledAt = addWeekdays(new Date(), findMerchant?.commissions[0].settlementDuration as number);  // Call the function to get the next 2 weekdays
          console.log(scheduledAt)
          const transaction = await prisma.scheduledTask.findUnique({
            where: {
              transactionId: tx?.transaction_id
            }
          })
          if (!transaction) {
            let scheduledTask = await prisma.scheduledTask.create({
              data: {
                transactionId: tx?.transaction_id,
                status: "pending",
                scheduledAt: scheduledAt, // Assign the calculated weekday date
                executedAt: null, // Assume executedAt is null when scheduling
              },
            });
          }
          setTimeout(async () => {
            transactionService.sendCallback(
              findMerchant?.webhook_url as string,
              tx,
              (tx?.providerDetails as JsonObject)?.account as string,
              "payin",
              findMerchant?.encrypted == "True" ? true : false,
              false,
              findMerchant
            )
          }, 30000)
          console.log("[CRON] Processing:", tx.transaction_id);
        } catch (err: any) {
          console.error("[CRON] Inquiry failed:", tx.transaction_id, err?.message ?? err);
        }
      }

      if (!chunk.length) break;
      console.log(`[CRON] Fetched batch size=${chunk.length}`);

      const last: { date_time: Date; transaction_id: string } = chunk[chunk.length - 1];
      cursorDate = last.date_time;
      cursorId = last.transaction_id;
    }

  }
  catch (err) {

  }
}
