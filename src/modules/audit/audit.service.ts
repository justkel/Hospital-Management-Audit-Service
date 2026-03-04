import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { AuditLog } from 'src/entities/audit-log.entity';
import { CreateAuditLogInput } from 'src/modules/audit/dto/create-audit-log.input';
import { Op, fn, col } from 'sequelize';
import { AuditDistinctField } from 'src/enums/audit-log.enum';
import { buildAuditDateFilter } from 'src/utils/audit-filter.util';
import { AuditPaginationInput } from 'src/graphql/types/paginate.type';

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

  async getDistinctValues(
    organizationId: string,
    field: AuditDistinctField,
  ): Promise<string[]> {
    const results = await this.auditLogModel.findAll({
      attributes: [[fn('DISTINCT', col(field)), field]],
      where: {
        organizationId,
        [field]: {
          [Op.ne]: null,
        },
      },
      raw: true,
    });

    return results.map((item) => item[field]);
  }

  async findById(id: string, organizationId: string): Promise<AuditLog> {
    const auditLog = await this.auditLogModel.findOne({
      where: {
        id,
        organizationId,
      },
    });

    if (!auditLog) {
      throw new NotFoundException('Audit log not found');
    }

    return auditLog;
  }

  async findAllPaginated(
    organizationId: string,
    pagination: AuditPaginationInput,
  ) {
    const {
      page,
      limit,
      action,
      actorId,
      entity,
      dateFilter,
      startDate,
      endDate,
    } = pagination;

    const offset = (page - 1) * limit;

    const where: any = { organizationId };

    if (action) where.action = action;
    if (actorId) where.actorId = actorId;
    if (entity) where.entity = entity;
    const createdAtFilter = buildAuditDateFilter({
      dateFilter,
      startDate,
      endDate,
    });

    if (createdAtFilter) {
      where.createdAt = createdAtFilter;
    }

    const { rows, count } = await this.auditLogModel.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    return {
      items: rows ?? [],
      total: count,
      page,
      pageCount: Math.ceil(count / limit),
    };
  }
}
