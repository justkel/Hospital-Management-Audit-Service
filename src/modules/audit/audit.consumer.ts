import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { RMQ_TOPICS } from '@justkel/shared';
import { AuditService } from './audit.service';
import { CreateAuditLogInput } from 'src/modules/audit/dto/create-audit-log.input';

@Controller()
export class AuditConsumer {
  private readonly logger = new Logger(AuditConsumer.name);

  constructor(private readonly auditService: AuditService) {}

  @EventPattern(RMQ_TOPICS.CREATE_AUDIT_LOG)
  async handleAuditLog(@Payload() data: CreateAuditLogInput) {
    this.logger.log(`Received Audit Log event: ${JSON.stringify(data)}`);

    await this.auditService.create({
      organizationId: data.organizationId,
      actorId: data.actorId,
      actorType: data.actorType,
      actorDescription: data.actorDescription,
      action: data.action,
      entity: data.entity,
      entityId: data.entityId,
      appName: data.appName,
      metadata: data.metadata,
    });
  }
}
