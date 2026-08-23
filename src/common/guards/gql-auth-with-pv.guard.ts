import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  CanActivate,
  Inject,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ContextUser, StaffStatus, UserRole, RMQ_TOPICS } from '@justkel/shared';
import { GqlJwtAuthGuard } from '@justkel/shared';
import { AuthClient } from 'src/sdk/auth.client';
import { StaffClient } from 'src/sdk/staff.client';
import { TokenBlacklistService } from 'src/services/token-blacklist.service';
import { GraphQLError } from 'graphql';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class GqlJwtAuthGuardWithPV implements CanActivate {
  constructor(
    private readonly baseGuard: GqlJwtAuthGuard,
    private readonly authClient: AuthClient,
    private readonly staffClient: StaffClient,
    private readonly blacklistService: TokenBlacklistService,
    @Inject('HOSPITAL_MAIN_SERVICE')
    private readonly mainServiceClient: ClientProxy,
  ) { }

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
        throw new GraphQLError('Token has been revoked', {
          extensions: {
            code: 'TOKEN_REVOKED',
          },
        });
      }
    }

    const staff = await this.authClient.getStaffById(user.sub);

    if (!staff) {
      throw new UnauthorizedException('Staff not found');
    }

    const freshUser: ContextUser = {
      ...user,
      roles: staff.roles,
    };

    req.user = freshUser;

    if (freshUser.pv !== staff.passwordVersion) {
      throw new GraphQLError('Password changed. Please log in again.', {
        extensions: {
          code: 'PASSWORD_CHANGED',
        },
      });
    }

    const isAdmin = staff.roles.includes('ADMIN');

    if (staff.status !== StaffStatus.ACTIVE && !isAdmin) {
      throw new GraphQLError('Account is not active.', {
        extensions: {
          code: 'ACCOUNT_INACTIVE',
        },
      });
    }

    if (staff.roles.includes(UserRole.GUEST)) {
      await this.assertGuestAccessValid(user.sub);
    }

    return true;
  }

  private async assertGuestAccessValid(staffId: string): Promise<void> {
    let status: { valid: boolean; reasonCode: string; requestId?: string };

    try {
      status = await this.staffClient.getGuestAccessStatus(staffId);
    } catch (error) {
      console.error('Failed to verify guest access via gRPC:', error);
      throw new GraphQLError('Unable to verify guest access', {
        extensions: { code: 'GUEST_ACCESS_UNVERIFIABLE' },
      });
    }

    if (!status.valid) {
      if (
        (status.reasonCode === 'GUEST_ACCESS_EXPIRED' ||
          status.reasonCode === 'GUEST_ACCESS_DISABLED') &&
        status.requestId
      ) {
        this.mainServiceClient.emit(RMQ_TOPICS.GUEST_REQUEST_EXPIRED_DETECTED, {
          requestId: status.requestId,
          reason:
            status.reasonCode === 'GUEST_ACCESS_EXPIRED' ? 'EXPIRED' : 'ORG_DISABLED',
        });
      }

      throw new GraphQLError(
        this.getGuestAccessDenialMessage(status.reasonCode),
        {
          extensions: {
            code:
              status.reasonCode === 'GUEST_ACCESS_EXPIRED'
                ? 'GUEST_ACCESS_DENIED'
                : status.reasonCode || 'GUEST_ACCESS_DENIED',
          },
        },
      );
    }
  }

  private getGuestAccessDenialMessage(reasonCode: string): string {
    switch (reasonCode) {
      case 'GUEST_BLOCKED':
        return 'Guest account is blocked';
      case 'GUEST_ACCESS_DISABLED':
        return 'Guest access is disabled for this organization';
      default:
        return 'Guest access is not active, has expired, or has been revoked';
    }
  }
}