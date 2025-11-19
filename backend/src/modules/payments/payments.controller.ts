import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, AppRole } from '../../common/decorators/roles.decorator';
import { RegisterPaymentDto } from './dto/register-payment.dto';

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Payments')
@ApiBearerAuth()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('order/:orderId')
  @Roles(AppRole.Admin, AppRole.Client)
  async byOrder(@Param('orderId') orderId: string) {
    return this.paymentsService.listByOrder(orderId);
  }

  @Post()
  @Roles(AppRole.Admin)
  async register(@Body() dto: RegisterPaymentDto) {
    return this.paymentsService.registerPayment(dto);
  }
}

