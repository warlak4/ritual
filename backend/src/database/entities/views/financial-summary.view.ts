import { ViewColumn, ViewEntity } from 'typeorm';

@ViewEntity({ schema: 'domain', name: 'vw_financial_summary' })
export class FinancialSummaryView {
  @ViewColumn({ name: 'order_id' })
  orderId!: string;

  @ViewColumn({ name: 'contract_number' })
  contractNumber!: string | null;

  @ViewColumn()
  status!: string;

  @ViewColumn({ name: 'amount_paid' })
  amountPaid!: number;

  @ViewColumn({ name: 'paid_transactions' })
  paidTransactions!: number;

  @ViewColumn({ name: 'first_payment_at' })
  firstPaymentAt!: Date | null;

  @ViewColumn({ name: 'last_payment_at' })
  lastPaymentAt!: Date | null;
}

