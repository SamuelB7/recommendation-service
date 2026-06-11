import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { jwtAccessSecret } from '../../../../config/auth.config';
import { AuthenticatedRequest, AuthenticatedUser } from '../authenticated-request';

type AccessTokenPayload = {
  sub: string;
  email: string;
  roles?: string[];
};

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractBearerToken(request.headers.authorization);

    if (!token) {
      throw new UnauthorizedException('Missing bearer token.');
    }

    try {
      const payload = await this.jwtService.verifyAsync<AccessTokenPayload>(token, {
        secret: jwtAccessSecret()
      });

      request.user = this.toUser(payload);
      return true;
    } catch {
      throw new UnauthorizedException('Invalid access token.');
    }
  }

  private extractBearerToken(header: string | string[] | undefined): string | null {
    const value = Array.isArray(header) ? header[0] : header;

    if (!value?.startsWith('Bearer ')) {
      return null;
    }

    return value.slice('Bearer '.length).trim();
  }

  private toUser(payload: AccessTokenPayload): AuthenticatedUser {
    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException('Invalid access token payload.');
    }

    return {
      id: payload.sub,
      email: payload.email,
      roles: payload.roles ?? []
    };
  }
}
