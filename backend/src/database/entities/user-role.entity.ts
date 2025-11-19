import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { UserEntity } from './user.entity';
import { RoleEntity } from './role.entity';

@Entity({ name: 'user_roles', schema: 'domain' })
export class UserRoleEntity {
  @PrimaryColumn({ name: 'user_id', type: 'uniqueidentifier' })
  userId!: string;

  @PrimaryColumn({ name: 'role_id', type: 'int' })
  roleId!: number;

  @Column({ name: 'assigned_at', type: 'datetime2' })
  assignedAt!: Date;

  @ManyToOne(() => UserEntity, (user) => user.userRoles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @ManyToOne(() => RoleEntity, (role) => role.userRoles, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role!: RoleEntity;
}

