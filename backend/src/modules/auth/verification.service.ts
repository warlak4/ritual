import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface VerificationCode {
  code: string;
  phone: string;
  expiresAt: Date;
  type: 'registration' | 'login';
}

@Injectable()
export class VerificationService {
  private codes = new Map<string, VerificationCode>();
  private readonly codeExpiryMinutes = 10;

  constructor(private readonly configService: ConfigService) {}

  generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  createVerificationCode(phone: string, type: 'registration' | 'login' = 'registration'): string {
    const code = this.generateCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.codeExpiryMinutes);

    const normalizedPhone = this.normalizePhone(phone);
    this.codes.set(normalizedPhone, {
      code,
      phone: normalizedPhone,
      expiresAt,
      type,
    });

    console.log(`✅ Verification code created: phone=${normalizedPhone}, code=${code}, type=${type}, expiresAt=${expiresAt.toISOString()}`);
    console.log(`📋 Total codes in storage: ${this.codes.size}`);

    setTimeout(() => {
      this.codes.delete(normalizedPhone);
      console.log(`⏰ Code expired and removed for phone: ${normalizedPhone}`);
    }, this.codeExpiryMinutes * 60 * 1000);

    return code;
  }

  getCodeByPhone(phone: string): string | null {
    const normalizedPhone = this.normalizePhone(phone);
    console.log(`🔍 Looking for code: phone=${phone} -> normalized=${normalizedPhone}`);
    console.log(`📋 Available phones in storage: ${Array.from(this.codes.keys()).join(', ')}`);
    
    const stored = this.codes.get(normalizedPhone);
    if (!stored) {
      console.log(`❌ No code found for normalized phone: ${normalizedPhone}`);
      return null;
    }

    if (new Date() > stored.expiresAt) {
      console.log(`⏰ Code expired for phone: ${normalizedPhone}, expiresAt=${stored.expiresAt.toISOString()}`);
      this.codes.delete(normalizedPhone);
      return null;
    }

    console.log(`✅ Code found for phone ${normalizedPhone}: ${stored.code}, expiresAt=${stored.expiresAt.toISOString()}`);
    return stored.code;
  }

  verifyCode(phone: string, code: string, type: 'registration' | 'login' = 'registration'): boolean {
    const normalizedPhone = this.normalizePhone(phone);
    const stored = this.codes.get(normalizedPhone);
    if (!stored) {
      return false;
    }

    if (stored.type !== type) {
      return false;
    }

    if (new Date() > stored.expiresAt) {
      this.codes.delete(normalizedPhone);
      return false;
    }

    if (stored.code !== code) {
      return false;
    }

    this.codes.delete(normalizedPhone);
    return true;
  }

  removeCode(phone: string): void {
    const normalizedPhone = this.normalizePhone(phone);
    this.codes.delete(normalizedPhone);
  }

  private normalizePhone(phone: string): string {
    // Удаляем все пробелы и нецифровые символы, кроме +
    let normalized = phone.replace(/\s+/g, '').replace(/[^\d+]/g, '');
    // Если номер начинается с 7 или 8 без +, добавляем +
    if (normalized.match(/^[78]\d{10}$/)) {
      normalized = '+' + normalized;
    }
    // Если номер начинается с 7, заменяем на +7
    if (normalized.startsWith('7') && !normalized.startsWith('+7')) {
      normalized = '+7' + normalized.substring(1);
    }
    return normalized;
  }
}

