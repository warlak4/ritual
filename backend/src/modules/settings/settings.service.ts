import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { UpdateProfileDto } from '../users/dto/update-profile.dto';

@Injectable()
export class SettingsService {
  constructor(private readonly usersService: UsersService) {}

  async getPreferences(userId: string) {
    const user = await this.usersService.findById(userId);
    return user.profile;
  }

  async updatePreferences(userId: string, dto: UpdateProfileDto) {
    return this.usersService.updateProfile(userId, dto);
  }
}

