import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthenticatedRequest } from '../authenticated-request';
import { REQUIRED_ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(REQUIRED_ROLES_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    if (!requiredRoles?.length) {
      return true;
    }

    const roles = context.switchToHttp().getRequest<AuthenticatedRequest>().user?.roles ?? [];

    if (requiredRoles.some((role) => roles.includes(role))) {
      return true;
    }

    throw new ForbiddenException('Insufficient role.');
  }
}
