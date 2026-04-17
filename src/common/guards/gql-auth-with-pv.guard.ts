import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  CanActivate,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ContextUser, StaffStatus } from '@justkel/shared';
import { GqlJwtAuthGuard } from '@justkel/shared';
import { AuthClient } from 'src/sdk/auth.client';
import { TokenBlacklistService } from 'src/services/token-blacklist.service';

@Injectable()
export class GqlJwtAuthGuardWithPV implements CanActivate {
  constructor(
    private readonly baseGuard: GqlJwtAuthGuard,
    private readonly authClient: AuthClient,
    private readonly blacklistService: TokenBlacklistService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const baseOk = await this.baseGuard.canActivate(context);
    if (!baseOk) return false;

    const ctx = GqlExecutionContext.create(context);
    const req = ctx.getContext().req;
    const user = req.user as ContextUser;

    if (user?.jti) {
      const isBlacklisted = await this.blacklistService.isBlacklisted(
        user.jti,
      );

      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }
    }

    const staff = await this.authClient.getStaffById(user.sub);

    if (!staff) {
      throw new UnauthorizedException('Staff not found');
    }

    if (user.pv !== staff.passwordVersion) {
      throw new UnauthorizedException(
        'Password changed. Please log in again.',
      );
    }

    const isAdmin = staff.roles.includes('ADMIN');

    if (staff.status !== StaffStatus.ACTIVE && !isAdmin) {
      throw new UnauthorizedException('Account is not active.');
    }

    return true;
  }
}