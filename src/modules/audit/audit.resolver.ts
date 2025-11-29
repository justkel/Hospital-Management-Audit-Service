import { Resolver, Query } from '@nestjs/graphql';
import { AuditService } from './audit.service';
import { AuditLog } from 'src/entities/audit-log.entity';
import {
  ContextUser,
  GqlCurrentUser,
  GqlJwtAuthGuard,
  Roles,
  RolesGuard,
  UserRole,
} from '@justkel/shared';
import { UseGuards } from '@nestjs/common';

@Resolver(() => AuditLog)
export class AuditResolver {
  constructor(private readonly auditService: AuditService) {}

  @Query(() => [AuditLog])
  @UseGuards(GqlJwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAuditLogs(@GqlCurrentUser() user: ContextUser) {
    return this.auditService.findAll(user.org);
  }
}
