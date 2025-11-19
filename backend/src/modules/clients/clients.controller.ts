import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, AppRole } from '../../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { CurrentUser } from '../../common/decorators/user.decorator';

@Controller('clients')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Clients')
@ApiBearerAuth()
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  @Roles(AppRole.Admin, AppRole.Client)
  async list(@Query() query: PaginationQueryDto) {
    return this.clientsService.listClients(query.page ?? 1, query.limit ?? 20);
  }

  @Get('secure')
  @Roles(AppRole.Admin)
  async secure() {
    return this.clientsService.listSecure();
  }

  @Get(':id')
  @Roles(AppRole.Admin, AppRole.Client)
  async getOne(@Param('id') id: string) {
    return this.clientsService.getClient(id);
  }

  @Post()
  @Roles(AppRole.Admin, AppRole.Client)
  async create(@CurrentUser() user: any, @Body() dto: CreateClientDto) {
    return this.clientsService.createClient(user?.sub ?? null, dto);
  }

  @Patch(':id')
  @Roles(AppRole.Admin)
  async update(@Param('id') id: string, @Body() dto: UpdateClientDto) {
    return this.clientsService.updateClient(id, dto);
  }
}

