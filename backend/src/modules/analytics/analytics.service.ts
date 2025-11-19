import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActiveOrderView, FinancialSummaryView, InventoryLoadView, CeremonyScheduleView } from '../../database/entities';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(ActiveOrderView) private readonly activeOrdersRepo: Repository<ActiveOrderView>,
    @InjectRepository(FinancialSummaryView) private readonly financialRepo: Repository<FinancialSummaryView>,
    @InjectRepository(InventoryLoadView) private readonly inventoryRepo: Repository<InventoryLoadView>,
    @InjectRepository(CeremonyScheduleView) private readonly ceremonyRepo: Repository<CeremonyScheduleView>,
  ) {}

  async getDashboard() {
    const [activeOrders, financial, inventory, ceremonies] = await Promise.all([
      this.activeOrdersRepo.find(),
      this.financialRepo.find(),
      this.inventoryRepo.find(),
      this.ceremonyRepo.find(),
    ]);

    const totalRevenue = financial.reduce((acc, item) => acc + (item.amountPaid ?? 0), 0);
    const completedOrders = financial.filter((item) => item.status === 'completed').length;
    const inventoryPressure = inventory.map((item) => ({
      name: item.name,
      load: item.bookedUpcoming / (item.quantityTotal || 1),
    }));

    return {
      kpis: {
        activeOrders: activeOrders.length,
        completedOrders,
        totalRevenue,
        upcomingCeremonies: ceremonies.filter((c) => c.startAt > new Date()).length,
      },
      activeOrders,
      financial,
      inventory,
      inventoryPressure,
    };
  }

  async getOrdersAnalytics() {
    return this.activeOrdersRepo.find();
  }

  async getFinancialAnalytics() {
    return this.financialRepo.find();
  }

  async getInventoryAnalytics() {
    return this.inventoryRepo.find();
  }

  async getCeremonyAnalytics() {
    return this.ceremonyRepo.find();
  }
}

