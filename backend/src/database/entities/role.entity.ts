import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { UserRoleEntity } from './user-role.entity';

@Entity({ name: 'roles', schema: 'ref' })
@Index('UQ_roles_code', ['code'], { unique: true })
export class RoleEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'nvarchar', length: 50 })
  code!: string;

  @Column({ name: 'name_ru', type: 'nvarchar', length: 100 })
  nameRu!: string;

  @Column({ name: 'name_en', type: 'nvarchar', length: 100 })
  nameEn!: string;

  @Column({ type: 'nvarchar', length: 400, nullable: true })
  description?: string;

  @Column({ name: 'created_at', type: 'datetime2' })
  createdAt!: Date;

  @OneToMany(() => UserRoleEntity, (userRole) => userRole.role)
  userRoles?: UserRoleEntity[];
}

