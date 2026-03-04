import { Resolver, Query, Args } from '@nestjs/graphql';
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
import { AuditDistinctField } from 'src/enums/audit-log.enum';
import {
  AuditPaginationResult,
  AuditPaginationInput,
} from 'src/graphql/types/paginate.type';

@Resolver(() => AuditLog)
export class AuditResolver {
  constructor(private readonly auditService: AuditService) {}

  @Query(() => [AuditLog])
  @UseGuards(GqlJwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAuditLogs(@GqlCurrentUser() user: ContextUser) {
    return this.auditService.findAll(user.org);
  }

  @Query(() => [String])
  @UseGuards(GqlJwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAuditDistinctValues(
    @Args('field', { type: () => AuditDistinctField })
    field: AuditDistinctField,
    @GqlCurrentUser() user: ContextUser,
  ) {
    return this.auditService.getDistinctValues(user.org, field);
  }

  @Query(() => AuditLog)
  @UseGuards(GqlJwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAuditLogById(
    @Args('id') id: string,
    @GqlCurrentUser() user: ContextUser,
  ) {
    return this.auditService.findById(id, user.org);
  }

  @Query(() => AuditPaginationResult, { name: 'auditLogs' })
  @UseGuards(GqlJwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async findAllAuditLogs(
    @GqlCurrentUser() user: ContextUser,
    @Args('pagination') pagination: AuditPaginationInput,
  ) {
    return this.auditService.findAllPaginated(user.org, pagination);
  }
}
