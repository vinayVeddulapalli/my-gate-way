import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.memberships) {
      throw new ForbiddenException('Access denied: No valid membership found');
    }

    // Check if user has any required role in any active membership
    const hasRole = user.memberships.some((m: any) =>
      requiredRoles.includes(m.role) && (m.status === 'APPROVED' || m.role === 'SUPER_ADMIN')
    );

    if (!hasRole) {
      throw new ForbiddenException(`Access denied: Requires role ${requiredRoles.join(' or ')}`);
    }

    return true;
  }
}
