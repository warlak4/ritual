import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UpdateProfileDto } from '../users/dto/update-profile.dto';
import { CurrentUser } from '../../common/decorators/user.decorator';

@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Settings')
@ApiBearerAuth()
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('preferences')
  async getPreferences(@CurrentUser() user: any) {
    return this.settingsService.getPreferences(user.sub);
  }

  @Patch('preferences')
  async updatePreferences(@CurrentUser() user: any, @Body() dto: UpdateProfileDto) {
    return this.settingsService.updatePreferences(user.sub, dto);
  }
}

