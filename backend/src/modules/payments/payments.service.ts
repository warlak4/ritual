import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PaymentEntity } from '../../database/entities';
import { RegisterPaymentDto } from './dto/register-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(PaymentEntity) private readonly paymentRepository: Repository<PaymentEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async listByOrder(orderId: string) {
    return this.paymentRepository.find({
      where: { order: { id: orderId } },
      order: { createdAt: 'DESC' },
    });
  }

  async registerPayment(dto: RegisterPaymentDto) {
    await this.dataSource.query(
      `
      EXEC domain.sp_register_payment
        @OrderId = @0,
        @Amount = @1,
        @Currency = @2,
        @Method = @3,
        @TransactionRef = @4,
        @PaidAt = @5,
        @Status = @6;
      `,
      [
        dto.orderId,
        dto.amount,
        dto.currency,
        dto.method,
        dto.transactionRef ?? null,
        dto.paidAt ? new Date(dto.paidAt) : null,
        dto.status ?? 'paid',
      ],
    );
    return this.listByOrder(dto.orderId);
  }
}

