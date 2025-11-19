import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ClientEntity } from './client.entity';
import { OrderEntity } from './order.entity';

@Entity({ name: 'deceased', schema: 'domain' })
export class DeceasedEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => ClientEntity, (client) => client.deceasedRelations, { nullable: false })
  @JoinColumn({ name: 'client_id' })
  client!: ClientEntity;

  @Column({ name: 'full_name', type: 'nvarchar', length: 200 })
  fullName!: string;

  @Column({ name: 'birth_date', type: 'date', nullable: true })
  birthDate?: Date;

  @Column({ name: 'death_date', type: 'date' })
  deathDate!: Date;

  @Column({ name: 'cause_of_death', type: 'nvarchar', length: 200, nullable: true })
  causeOfDeath?: string;

  @Column({ name: 'burial_type', type: 'nvarchar', length: 20 })
  burialType!: string;

  @Column({ type: 'nvarchar', length: 100, nullable: true })
  religion?: string;

  @Column({ type: 'nvarchar', nullable: true })
  bio?: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime2' })
  createdAt!: Date;

  @OneToMany(() => OrderEntity, (order) => order.deceased)
  orders?: OrderEntity[];
}

