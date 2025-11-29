import { Resolver, Query } from '@nestjs/graphql';
import { AuditService } from './audit.service';
import { AuditLog } from 'src/entities/audit-log.entity';

@Resolver(() => AuditLog)
export class AuditResolver {
  constructor(private readonly auditService: AuditService) {}

  //   @Query(() => [AuditLog])
  //   async getAuditLogs() {
  //     return this.auditService.findAll();
  //   }

  @Query(() => String)
  async getAuditLogs() {
    return 'Hello';
  }
}
