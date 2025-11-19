import { ViewColumn, ViewEntity } from 'typeorm';

@ViewEntity({ schema: 'domain', name: 'vw_clients_secure' })
export class ClientSecureView {
  @ViewColumn()
  id!: string;

  @ViewColumn({ name: 'full_name' })
  fullName!: string;

  @ViewColumn({ name: 'contact_email' })
  contactEmail!: string | null;

  @ViewColumn({ name: 'contact_phone' })
  contactPhone!: string | null;

  @ViewColumn({ name: 'address_plain' })
  addressPlain!: string | null;

  @ViewColumn({ name: 'passport_plain' })
  passportPlain!: string | null;

  @ViewColumn()
  notes!: string | null;

  @ViewColumn({ name: 'is_vip' })
  isVip!: boolean;

  @ViewColumn({ name: 'created_at' })
  createdAt!: Date;

  @ViewColumn({ name: 'updated_at' })
  updatedAt!: Date | null;
}

