import { Body, Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { AppRole } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Users')
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@CurrentUser() user: any) {
    return this.usersService.findById(user.sub);
  }

  @Patch('me/profile')
  async updateProfile(@CurrentUser() user: any, @Body() dto: UpdateProfileDto) {
    const profile = await this.usersService.updateProfile(user.sub, dto);
    return { success: true, profile };
  }

  @Get()
  @Roles(AppRole.Admin)
  async listUsers() {
    return this.usersService.listUsers();
  }

  @Patch(':id/roles')
  @Roles(AppRole.Admin)
  async updateUserRoles(@Param('id') userId: string, @Body() body: { roles: string[] }) {
    const user = await this.usersService.updateUserRoles(userId, body.roles);
    return { success: true, user };
  }
}

