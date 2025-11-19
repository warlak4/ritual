import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

export enum AppRole {
  Admin = 'admin',
  Manager = 'manager',
  Client = 'client',
  Guest = 'guest',
}

export const Roles = (...roles: AppRole[]) => SetMetadata(ROLES_KEY, roles);

