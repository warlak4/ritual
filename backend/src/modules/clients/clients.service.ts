import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ClientEntity, ClientSecureView } from '../../database/entities';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(ClientEntity) private readonly clientsRepository: Repository<ClientEntity>,
    @InjectRepository(ClientSecureView) private readonly secureViewRepository: Repository<ClientSecureView>,
    private readonly dataSource: DataSource,
  ) {}

  async listClients(page = 1, limit = 20): Promise<{ data: ClientEntity[]; total: number }> {
    const [data, total] = await this.clientsRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['user', 'deceasedRelations'],
    });
    return { data, total };
  }

  async listSecure(): Promise<ClientSecureView[]> {
    return this.secureViewRepository.find();
  }

  async getClient(id: string): Promise<ClientEntity> {
    const client = await this.clientsRepository.findOne({ where: { id }, relations: ['user'] });
    if (!client) {
      throw new NotFoundException(`Client ${id} not found`);
    }
    return client;
  }

  async createClient(userId: string | null, dto: CreateClientDto): Promise<ClientEntity> {
    const [{ clientId }] = await this.dataSource.query(
      `
      DECLARE @ClientId UNIQUEIDENTIFIER;
      EXEC domain.sp_upsert_client
        @ClientId = @ClientId OUTPUT,
        @UserId = @0,
        @FullName = @1,
        @ContactEmail = @2,
        @ContactPhone = @3,
        @AddressPlain = @4,
        @PassportPlain = @5,
        @Notes = @6,
        @IsVip = @7;
      SELECT @ClientId AS clientId;
      `,
      [
        userId,
        dto.fullName,
        dto.contactEmail ?? null,
        dto.contactPhone ?? null,
        dto.addressPlain ?? null,
        dto.passportPlain ?? null,
        dto.notes ?? null,
        dto.isVip ?? false,
      ],
    );
    return this.getClient(clientId);
  }

  async updateClient(id: string, dto: UpdateClientDto): Promise<ClientEntity> {
    await this.dataSource.query(
      `
      DECLARE @ClientId UNIQUEIDENTIFIER = @0;
      EXEC domain.sp_upsert_client
        @ClientId = @ClientId OUTPUT,
        @UserId = @1,
        @FullName = @2,
        @ContactEmail = @3,
        @ContactPhone = @4,
        @AddressPlain = @5,
        @PassportPlain = @6,
        @Notes = @7,
        @IsVip = @8;
      `,
      [
        id,
        null,
        dto.fullName ?? null,
        dto.contactEmail ?? null,
        dto.contactPhone ?? null,
        dto.addressPlain ?? null,
        dto.passportPlain ?? null,
        dto.notes ?? null,
        dto.isVip ?? false,
      ],
    );
    return this.getClient(id);
  }
}

