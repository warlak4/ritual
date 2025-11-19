import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, AppRole } from '../../common/decorators/roles.decorator';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Analytics')
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @Roles(AppRole.Admin, AppRole.Client)
  async dashboard() {
    return this.analyticsService.getDashboard();
  }

  @Get('orders')
  @Roles(AppRole.Admin, AppRole.Client)
  async orders() {
    return this.analyticsService.getOrdersAnalytics();
  }

  @Get('financial')
  @Roles(AppRole.Admin)
  async financial() {
    return this.analyticsService.getFinancialAnalytics();
  }

  @Get('inventory')
  @Roles(AppRole.Admin, AppRole.Client)
  async inventory() {
    return this.analyticsService.getInventoryAnalytics();
  }

  @Get('ceremonies')
  @Roles(AppRole.Admin, AppRole.Client)
  async ceremonies() {
    return this.analyticsService.getCeremonyAnalytics();
  }
}

