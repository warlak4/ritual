import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { UserEntity } from './user.entity';

@Entity({ name: 'user_profiles', schema: 'domain' })
export class UserProfileEntity {
  @PrimaryColumn({ name: 'user_id', type: 'uniqueidentifier' })
  userId!: string;

  @Column({ name: 'preferred_language', type: 'nvarchar', length: 5 })
  preferredLanguage!: string;

  @Column({ type: 'nvarchar', length: 30 })
  theme!: string;

  @Column({ name: 'date_format', type: 'nvarchar', length: 30 })
  dateFormat!: string;

  @Column({ name: 'number_format', type: 'nvarchar', length: 15 })
  numberFormat!: string;

  @Column({ name: 'page_size', type: 'int' })
  pageSize!: number;

  @Column({ name: 'saved_filters', type: 'nvarchar', nullable: true })
  savedFilters?: string;

  @Column({ name: 'created_at', type: 'datetime2' })
  createdAt!: Date;

  @Column({ name: 'updated_at', type: 'datetime2', nullable: true })
  updatedAt?: Date;

  @OneToOne(() => UserEntity, (user) => user.profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;
}

