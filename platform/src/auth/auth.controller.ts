import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';

import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { TokenResponseDto } from './dto/token-response.dto';
import { UserResponseDto } from './dto/user-response.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 5 * 60_000 } })
  register(@Body() dto: RegisterDto): Promise<UserResponseDto> {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<TokenResponseDto> {
    const tokens = await this.authService.login(dto);
    this.setRefreshCookie(res, tokens.refreshToken);
    return { accessToken: tokens.accessToken, tokenType: tokens.tokenType };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<TokenResponseDto> {
    const { name } = this.authService.getRefreshCookieConfig();
    const cookies = req.cookies as Record<string, string | undefined>;
    const token = cookies?.[name];
    if (!token) {
      throw new UnauthorizedException('Missing refresh token');
    }
    const tokens = await this.authService.refreshToken(token);
    this.setRefreshCookie(res, tokens.refreshToken);
    return { accessToken: tokens.accessToken, tokenType: tokens.tokenType };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Res({ passthrough: true }) res: Response): void {
    const { name, options } = this.authService.getRefreshCookieConfig();
    res.clearCookie(name, { path: options.path });
  }

  @Get('me')
  @UseGuards(AuthGuard)
  me(@CurrentUser() user: { userId: string; email: string }): {
    userId: string;
    email: string;
  } {
    return user;
  }

  private setRefreshCookie(res: Response, token: string): void {
    const { name, options } = this.authService.getRefreshCookieConfig();
    res.cookie(name, token, options);
  }
}
