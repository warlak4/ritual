import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoleEntity, UserEntity, UserProfileEntity } from '../../database/entities';
import { hashPassword } from '../../common/utils/password.util';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity) private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(UserProfileEntity) private readonly profilesRepository: Repository<UserProfileEntity>,
    @InjectRepository(RoleEntity) private readonly rolesRepository: Repository<RoleEntity>,
  ) {}

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.usersRepository.findOne({
      where: { email },
      relations: ['profile', 'roles'],
    });
  }

  async findByPhone(phone: string): Promise<UserEntity | null> {
    const normalizedPhone = phone.replace(/\s+/g, '').replace(/[^\d+]/g, '');
    return this.usersRepository.findOne({
      where: { phone: normalizedPhone },
      relations: ['profile', 'roles'],
    });
  }

  async findById(id: string): Promise<UserEntity> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['profile', 'roles'],
    });
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return user;
  }

  async createUser(payload: CreateUserDto, roleCodes: string[] = ['client']): Promise<UserEntity> {
    const passwordHash = await hashPassword(payload.password);
    const roles = await this.rolesRepository.find({
      where: roleCodes.map((code) => ({ code })),
    });
    if (roles.length === 0) {
      throw new NotFoundException(`Roles ${roleCodes.join(', ')} not found`);
    }
    const user = this.usersRepository.create({
      email: payload.email.toLowerCase(),
      passwordHash,
      firstName: payload.firstName,
      lastName: payload.lastName,
      phone: payload.phone,
      status: 'active',
      roles,
    });
    user.profile = this.profilesRepository.create({
      preferredLanguage: payload.preferredLanguage ?? 'ru',
      theme: payload.theme ?? 'dark',
      dateFormat: payload.dateFormat ?? 'dd.MM.yyyy',
      numberFormat: payload.numberFormat ?? '1 234,56',
      pageSize: payload.pageSize ?? 20,
    });
    const saved = await this.usersRepository.save(user);
    return this.findById(saved.id);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.usersRepository.update({ id }, { lastLoginAt: new Date() });
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<UserProfileEntity> {
    const profile = await this.profilesRepository.findOne({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('User profile not found');
    }
    Object.assign(profile, dto, {
      updatedAt: new Date(),
    });
    return this.profilesRepository.save(profile);
  }

  async listUsers(): Promise<UserEntity[]> {
    return this.usersRepository.find({ relations: ['profile', 'roles'], order: { createdAt: 'DESC' } });
  }

  async updateUserRoles(userId: string, roleCodes: string[]): Promise<UserEntity> {
    const user = await this.findById(userId);
    const roles = await this.rolesRepository.find({
      where: roleCodes.map((code) => ({ code })),
    });
    if (roles.length === 0) {
      throw new NotFoundException(`Roles ${roleCodes.join(', ')} not found`);
    }
    user.roles = roles;
    await this.usersRepository.save(user);
    return this.findById(userId);
  }

  async findByFullName(firstName: string, lastName: string): Promise<UserEntity | null> {
    return this.usersRepository.findOne({
      where: { firstName, lastName },
      relations: ['profile', 'roles'],
    });
  }

  async findAdminsAndManagers(): Promise<UserEntity[]> {
    return this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'role')
      .leftJoinAndSelect('user.profile', 'profile')
      .where('role.code IN (:...roles)', { roles: ['admin', 'manager'] })
      .andWhere('user.status = :status', { status: 'active' })
      .getMany();
  }
}

