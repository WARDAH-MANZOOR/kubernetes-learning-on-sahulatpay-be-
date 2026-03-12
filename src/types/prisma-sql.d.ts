declare module "@prisma/client/sql" {
  // Result of get_pending_settlements
  export type PendingSettlement = {
    merchant_id: number;
    company_name: string;
    full_name: string;
    scheduled_task_count: number;
    total_transaction_amount: number;
  };

  // Result of getAllProfitsBalancesByMerchant
  export type ProfitBalance = {
    merchant_id: number;
    full_name: string;
    company_name: string;
    total_balance: number;
    profit: number;
  };

  // Result of getTransactionsDaywise
  export type TransactionDaywise = {
    transaction_date: string;
    total_settled_amount: number;
  };

  // Prisma exports
  export const get_pending_settlements: () => Promise<PendingSettlement[]>;
  export const getAllProfitsBalancesByMerchant: (merchantId: number, from: Date, to: Date) => Promise<ProfitBalance[]>;
  export const getProfitAndBalance: (from: Date, to: Date) => Promise<ProfitBalance[]>;
  export const getTransactionsDaywise: (merchantId: number) => Promise<TransactionDaywise[]>;
}