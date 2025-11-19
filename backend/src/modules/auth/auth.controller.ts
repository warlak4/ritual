import { Body, Controller, Post, UseGuards, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RequestCodeDto } from './dto/request-code.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { RequestCodePhoneDto } from './dto/request-code-phone.dto';
import { VerifyCodePhoneDto } from './dto/verify-code-phone.dto';
import { Public } from '../../common/decorators/public.decorator';
import { UsersService } from '../users/users.service';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AppRole, Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(private readonly authService: AuthService, private readonly usersService: UsersService) {}

  @Public()
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('register')
  async register(@Body() dto: CreateUserDto) {
    return this.authService.register(dto, [AppRole.Client]);
  }

  @Public()
  @Post('request-registration-code')
  async requestRegistrationCode(@Body() dto: RequestCodePhoneDto) {
    return this.authService.requestRegistrationCode(dto.phone);
  }

  @Public()
  @Post('register-with-code')
  async registerWithCode(@Body() dto: CreateUserDto & { code: string }) {
    return this.authService.registerWithCode(dto, [AppRole.Client]);
  }

  @Public()
  @Post('request-login-code')
  async requestLoginCode(@Body() dto: RequestCodeDto) {
    return this.authService.requestLoginCode(dto.email);
  }

  @Public()
  @Post('login-with-code')
  async loginWithCode(@Body() dto: VerifyCodeDto) {
    return this.authService.loginWithCode(dto);
  }

  @Public()
  @Post('refresh')
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto);
  }

  @Post('register/admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(AppRole.Admin)
  async createAdmin(@Body() dto: CreateUserDto) {
    return this.authService.register(dto, [AppRole.Admin]);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async me(@CurrentUser() user: any) {
    return this.usersService.findById(user.sub);
  }
}

