import {
  ConflictException,
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import type { StringValue } from 'ms';
import { randomBytes } from 'node:crypto';

import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { TokenResponseDto } from './dto/token-response.dto';
import { UserResponseDto } from './dto/user-response.dto';

interface JwtPayload {
  sub: string;
  email: string;
}

const BCRYPT_COST = 10;

@Injectable()
export class AuthService implements OnModuleInit {
  private dummyHash!: string;
  private readonly refreshSecret: string;
  private readonly refreshExpiration: StringValue;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    config: ConfigService,
  ) {
    this.refreshSecret = config.getOrThrow<string>('JWT_REFRESH_SECRET');
    this.refreshExpiration = config.getOrThrow<string>(
      'JWT_REFRESH_EXPIRATION',
    ) as StringValue;
  }

  async onModuleInit(): Promise<void> {
    this.dummyHash = await bcrypt.hash(
      randomBytes(16).toString('hex'),
      BCRYPT_COST,
    );
  }

  async register(dto: RegisterDto): Promise<UserResponseDto> {
    const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_COST);

    try {
      const user = await this.prisma.user.create({
        data: { email: dto.email, hashedPassword },
      });
      return this.toUserResponse(user);
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('Email already registered');
      }
      throw error;
    }
  }

  async login(dto: LoginDto): Promise<TokenResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    const hashToCompare = user?.hashedPassword ?? this.dummyHash;

    const passwordMatches = await bcrypt.compare(dto.password, hashToCompare);

    if (!user || !passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueTokens({ sub: user.id, email: user.email });
  }

  async refreshToken(token: string): Promise<TokenResponseDto> {
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(token, {
        secret: this.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    return this.issueTokens({ sub: payload.sub, email: payload.email });
  }

  async validateToken(
    token: string,
  ): Promise<{ userId: string; email: string }> {
    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token);
      return { userId: payload.sub, email: payload.email };
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }

  private async issueTokens(payload: JwtPayload): Promise<TokenResponseDto> {
    const accessToken = await this.jwt.signAsync(payload);
    const refreshToken = await this.jwt.signAsync(payload, {
      secret: this.refreshSecret,
      expiresIn: this.refreshExpiration,
    });
    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
    };
  }

  private toUserResponse(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
    };
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }
}
