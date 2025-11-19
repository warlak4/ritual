import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  OrderEntity,
  OrderServiceEntity,
  ActiveOrderView,
  FinancialSummaryView,
  CeremonyEntity,
  PaymentEntity,
} from '../../database/entities';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';

@Module({
  imports: [TypeOrmModule.forFeature([OrderEntity, OrderServiceEntity, ActiveOrderView, FinancialSummaryView, CeremonyEntity, PaymentEntity])],
  providers: [OrdersService],
  controllers: [OrdersController],
  exports: [OrdersService],
})
export class OrdersModule {}

