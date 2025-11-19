const fs = require('fs');
const content = `import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { comparePassword } from '../../common/utils/password.util';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AppRole } from '../../common/decorators/roles.decorator';

const messages = {
  userExists: '\\u041F\\u043E\\u043B\\u044C\\u0437\\u043E\\u0432\\u0430\\u0442\\u0435\\u043B\\u044C \\u0441 \\u0442\\u0430\\u043A\\u0438\\u043C email \\u0443\\u0436\\u0435 \\u0441\\u0443\\u0449\\u0435\\u0441\\u0442\\u0432\\u0443\\u0435\\u0442',
  refreshInvalid: '\\u041D\\u0435\\u0434\\u0435\\u0439\\u0441\\u0442\\u0432\\u0438\\u0442\\u0435\\u043B\\u044C\\u043D\\u044B\\u0439 refresh token',
  userNotFound: '\\u0422\\u0430\\u043A\\u043E\\u0433\\u043E \\u043F\\u043E\\u043B\\u044C\\u0437\\u043E\\u0432\\u0430\\u0442\\u0435\\u043B\\u044F \\u043D\\u0435 \\u0441\\u0443\\u0449\\u0435\\u0441\\u0442\\u0432\\u0443\\u0435\\u0442',
  invalidPassword: '\\u041D\\u0435\\u043F\\u0440\\u0430\\u0432\\u0438\\u043B\\u044C\\u043D\\u044B\\u0439 \\u043F\\u0430\\u0440\\u043E\\u043B\\u044C',
  passwordWeak: '\\u041F\\u0430\\u0440\\u043E\\u043B\\u044C \\u0441\\u043B\\u0438\\u0448\\u043A\\u043E\\u043C \\u043F\\u0440\\u043E\\u0441\\u0442\\u043E\\u0439: \\u0434\\u043E\\u0431\\u0430\\u0432\\u044C\\u0442\\u0435 ',
  uppercase: '\\u0437\\u0430\\u0433\\u043B\\u0430\\u0432\\u043D\\u0443\\u044E \\u0431\\u0443\\u043A\\u0432\\u0443',
  lowercase: '\\u0441\\u0442\\u0440\\u043E\\u0447\\u043D\\u0443\\u044E \\u0431\\u0443\\u043A\\u0432\\u0443',
  digit: '\\u0446\\u0438\\u0444\\u0440\\u0443',
  special: '\\u0441\\u043F\\u0435\\u0446\\u0441\\u0438\\u043C\\u0432\\u043E\\u043B',
};

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  roles: AppRole[];
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(payload: LoginDto): Promise<TokenPair> {
    const user = await this.validateCredentials(payload.email, payload.password);
    await this.usersService.updateLastLogin(user.id);
    return this.generateTokens(user.id, user.roles.map((role) => role.code as AppRole));
  }

  async register(dto: CreateUserDto, roles: AppRole[] = [AppRole.Client]): Promise<TokenPair> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException(messages.userExists);
    }
    this.ensurePasswordStrength(dto.password);
    const user = await this.usersService.createUser(dto, roles);
    return this.generateTokens(user.id, user.roles.map((role) => role.code as AppRole));
  }

  async refreshTokens(dto: RefreshTokenDto): Promise<TokenPair> {
    try {
      const refreshSecret = this.configService.get<string>('app.jwt.secret');
      const payload = await this.jwtService.verifyAsync(dto.refreshToken, {
        secret: refreshSecret,
      });
      return this.generateTokens(payload.sub, payload.roles);
    } catch {
      throw new UnauthorizedException(messages.refreshInvalid);
    }
  }

  private async generateTokens(userId: string, roles: AppRole[]): Promise<TokenPair> {
    const jwtConfig = this.configService.get('app.jwt');
    const payload = {
      sub: userId,
      roles,
    };
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: jwtConfig.accessTokenTtl,
    });
    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: jwtConfig.refreshTokenTtl,
    });

    const expiresInSeconds =
      typeof jwtConfig.accessTokenTtl === 'string' ? this.parseExpiry(jwtConfig.accessTokenTtl) : jwtConfig.accessTokenTtl;

    return {
      accessToken,
      refreshToken,
      expiresIn: expiresInSeconds,
      roles,
    };
  }

  private parseExpiry(exp: string): number {
    const match = /^(\d+)([smhd])$/.exec(exp);
    if (!match) {
      return 900;
    }
    const value = parseInt(match[1], 10);
    const unit = match[2];
    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      default:
        return 900;
    }
  }

  private async validateCredentials(email: string, password: string) {
    const user = await this.usersService.findByEmail(email.toLowerCase());
    if (!user) {
      throw new UnauthorizedException(messages.userNotFound);
    }
    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException(messages.invalidPassword);
    }
    return user;
  }

  private ensurePasswordStrength(password: string) {
    const missing: string[] = [];
    if (!/[A-ZРђ-РЇ]/.test(password)) {
      missing.push(messages.uppercase);
    }
    if (!/[a-zР°-СЏ]/.test(password)) {
      missing.push(messages.lowercase);
    }
    if (!/\d/.test(password)) {
      missing.push(messages.digit);
    }
    if (!/[^\w\sРђ-РЇР°-СЏ]/.test(password)) {
      missing.push(messages.special);
    }
    if (missing.length > 0) {
      throw new BadRequestException(messages.passwordWeak + missing.join(', '));
    }
  }
}
`;

fs.writeFileSync('backend/src/modules/auth/auth.service.ts', content, 'utf8');
