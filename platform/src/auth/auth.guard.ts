import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

import { AuthService } from './auth.service';

export interface AuthenticatedRequest extends Request {
  user: { userId: string; email: string };
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractBearerToken(request);

    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    request.user = await this.authService.validateToken(token);
    return true;
  }

  private extractBearerToken(request: Request): string | null {
    const header = request.headers.authorization;
    if (!header) return null;
    const [scheme, value] = header.split(' ');
    return scheme === 'Bearer' && value ? value : null;
  }
}
