import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  OrderEntity,
  OrderServiceEntity,
  ActiveOrderView,
  FinancialSummaryView,
  PaymentEntity,
} from '../../database/entities';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(OrderEntity) private readonly orderRepository: Repository<OrderEntity>,
    @InjectRepository(OrderServiceEntity) private readonly orderServiceRepository: Repository<OrderServiceEntity>,
    @InjectRepository(ActiveOrderView) private readonly activeOrderRepository: Repository<ActiveOrderView>,
    @InjectRepository(FinancialSummaryView) private readonly financialRepository: Repository<FinancialSummaryView>,
    @InjectRepository(PaymentEntity) private readonly paymentRepository: Repository<PaymentEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async listOrders(page = 1, limit = 20) {
    const [data, total] = await this.orderRepository.findAndCount({
      order: { createdAt: 'DESC' },
      relations: ['client', 'deceased', 'responsibleUser', 'services', 'services.service'],
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  async listActiveOrders() {
    return this.activeOrderRepository.find();
  }

  async getFinancialSummary() {
    return this.financialRepository.find();
  }

  async getOrder(id: string): Promise<OrderEntity> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: [
        'client',
        'deceased',
        'responsibleUser',
        'services',
        'services.service',
        'ceremonies',
        'payments',
        'documents',
      ],
    });
    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }
    return order;
  }

  async createOrder(userId: string, dto: CreateOrderDto): Promise<OrderEntity> {
    if (!dto.services || dto.services.length === 0) {
      throw new Error('Order must contain at least one service');
    }
    const params: any[] = [
      dto.clientId,
      dto.deceasedId,
      dto.responsibleUserId ?? userId ?? null,
      dto.packageId ?? null,
      dto.currency,
      dto.contractNumber ?? null,
    ];

    let placeholderIndex = params.length;
    const valuesClause = dto.services
      .map((svc) => {
        const placeholders = [
          `@${placeholderIndex}`,
          `@${placeholderIndex + 1}`,
          `@${placeholderIndex + 2}`,
          `@${placeholderIndex + 3}`,
        ];
        params.push(svc.serviceId, svc.quantity, svc.unitPrice, svc.discount);
        placeholderIndex += 4;
        return `(${placeholders.join(', ')})`;
      })
      .join(',\n        ');

    const sql = `
      DECLARE @OrderId UNIQUEIDENTIFIER;
      DECLARE @Services domain.udt_OrderService;
      INSERT INTO @Services (service_id, quantity, unit_price, discount)
      VALUES
        ${valuesClause};
      EXEC domain.sp_create_order
        @ClientId = @0,
        @DeceasedId = @1,
        @ResponsibleUserId = @2,
        @PackageId = @3,
        @Currency = @4,
        @Services = @Services,
        @ContractNumber = @5,
        @OrderId = @OrderId OUTPUT;
      SELECT @OrderId AS orderId;
    `;

    const [{ orderId }] = await this.dataSource.query(sql, params);
    return this.getOrder(orderId);
  }

  async updateStatus(orderId: string, dto: UpdateOrderStatusDto): Promise<OrderEntity> {
    const order = await this.getOrder(orderId);
    order.status = dto.status;
    await this.orderRepository.save(order);
    return this.getOrder(orderId);
  }

  async listPayments(orderId: string) {
    return this.paymentRepository.find({
      where: { order: { id: orderId } },
      order: { paidAt: 'DESC' },
    });
  }
}

