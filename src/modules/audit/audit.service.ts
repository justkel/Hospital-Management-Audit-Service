import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { AuditLog } from 'src/entities/audit-log.entity';
import { CreateAuditLogInput } from 'src/modules/audit/dto/create-audit-log.input';

@Injectable()
export class AuditService {
  constructor(@InjectModel(AuditLog) private auditLogModel: typeof AuditLog) {}

  async create(input: CreateAuditLogInput): Promise<AuditLog> {
    return this.auditLogModel.create({
      ...input,
      createdAt: new Date(),
    });
  }

  async findAll(organizationId: string) {
    return this.auditLogModel.findAll({
      where: { organizationId },
      order: [['createdAt', 'DESC']],
    });
  }
}
