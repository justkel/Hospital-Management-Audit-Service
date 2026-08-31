import { Resolver, Query, Args } from '@nestjs/graphql';
import { AuditService } from './audit.service';
import { AuditLog } from 'src/entities/audit-log.entity';
import {
  ContextUser,
  GqlCurrentUser,
  Roles,
  RolesGuard,
  UserRole,
} from '@justkel/shared';
import { UseGuards } from '@nestjs/common';
import { ActorActivityPeriod, AuditDistinctField, PeakHoursPeriod } from 'src/enums/audit-log.enum';
import {
  AuditPaginationResult,
  AuditPaginationInput,
} from 'src/graphql/types/paginate.type';
import { GqlJwtAuthGuardWithPV } from 'src/common/guards/gql-auth-with-pv.guard';
import { ActorActivityStats } from './types/actor-activity-stats.type';
import { PeakHoursStats } from './types/peak-hours.type';

@Resolver(() => AuditLog)
export class AuditResolver {
  constructor(private readonly auditService: AuditService) { }

  @Query(() => [AuditLog])
  @UseGuards(GqlJwtAuthGuardWithPV, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAuditLogs(@GqlCurrentUser() user: ContextUser) {
    return this.auditService.findAll(user.org);
  }

  @Query(() => [String])
  @UseGuards(GqlJwtAuthGuardWithPV, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAuditDistinctValues(
    @Args('field', { type: () => AuditDistinctField })
    field: AuditDistinctField,
    @GqlCurrentUser() user: ContextUser,
  ) {
    return this.auditService.getDistinctValues(user.org, field);
  }

  @Query(() => AuditLog)
  @UseGuards(GqlJwtAuthGuardWithPV, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAuditLogById(
    @Args('id') id: string,
    @GqlCurrentUser() user: ContextUser,
  ) {
    return this.auditService.findById(id, user.org);
  }

  @Query(() => AuditPaginationResult, { name: 'auditLogs' })
  @UseGuards(GqlJwtAuthGuardWithPV, RolesGuard)
  @Roles(UserRole.ADMIN)
  async findAllAuditLogs(
    @GqlCurrentUser() user: ContextUser,
    @Args('pagination') pagination: AuditPaginationInput,
  ) {
    return this.auditService.findAllPaginated(user.org, pagination);
  }

  @Query(() => ActorActivityStats)
  @UseGuards(GqlJwtAuthGuardWithPV)
  async getActorActivityStats(
    @Args('period', { type: () => ActorActivityPeriod })
    period: ActorActivityPeriod,
    @GqlCurrentUser() user: ContextUser,
  ) {
    return this.auditService.getActorActivityStats(user.org, user.sub, period);
  }

  @Query(() => PeakHoursStats)
  @UseGuards(GqlJwtAuthGuardWithPV)
  async getOrganizationPeakHours(
    @Args('period', { type: () => PeakHoursPeriod })
    period: PeakHoursPeriod,
    @GqlCurrentUser() user: ContextUser,
  ): Promise<PeakHoursStats> {
    return this.auditService.getPeakHoursStats(user.org, period);
  }

}
