import { Column, CreateDateColumn, Entity, Index, JoinTable, ManyToMany, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { RoleEntity } from './role.entity';
import { UserProfileEntity } from './user-profile.entity';
import { ClientEntity } from './client.entity';
import { OrderEntity } from './order.entity';
import { UserRoleEntity } from './user-role.entity';

@Entity({ name: 'users', schema: 'domain' })
@Index('UQ_users_email', ['email'], { unique: true })
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'nvarchar', length: 255 })
  email!: string;

  @Column({ name: 'password_hash', type: 'nvarchar', length: 255 })
  passwordHash!: string;

  @Column({ name: 'first_name', type: 'nvarchar', length: 120 })
  firstName!: string;

  @Column({ name: 'last_name', type: 'nvarchar', length: 120 })
  lastName!: string;

  @Column({ type: 'nvarchar', length: 50, nullable: true })
  phone?: string;

  @Column({ type: 'nvarchar', length: 20 })
  status!: string;

  @Column({ name: 'last_login_at', type: 'datetime2', nullable: true })
  lastLoginAt?: Date;

  @CreateDateColumn({ name: 'created_at', type: 'datetime2' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime2', nullable: true })
  updatedAt?: Date;

  @Column({ name: 'deleted_at', type: 'datetime2', nullable: true })
  deletedAt?: Date;

  @OneToOne(() => UserProfileEntity, (profile) => profile.user, { cascade: true })
  profile?: UserProfileEntity;

  @ManyToMany(() => RoleEntity, { eager: true })
  @JoinTable({
    name: 'user_roles',
    schema: 'domain',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles!: RoleEntity[];

  @OneToMany(() => UserRoleEntity, (userRole) => userRole.user)
  userRoles?: UserRoleEntity[];

  @OneToMany(() => ClientEntity, (client) => client.user)
  clients?: ClientEntity[];

  @OneToMany(() => OrderEntity, (order) => order.responsibleUser)
  responsibleOrders?: OrderEntity[];
}

