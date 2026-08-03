import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { AuditLog } from 'src/entities/audit-log.entity';
import { CreateAuditLogInput } from 'src/modules/audit/dto/create-audit-log.input';
import { Op, fn, col } from 'sequelize';
import { ActorActivityPeriod, AuditDistinctField } from 'src/enums/audit-log.enum';
import { buildAuditDateFilter } from 'src/utils/audit-filter.util';
import { AuditPaginationInput } from 'src/graphql/types/paginate.type';
import { ActorActivityStats, ActorActivityBucket } from './types/actor-activity-stats.type';

@Injectable()
export class AuditService {
  constructor(@InjectModel(AuditLog) private auditLogModel: typeof AuditLog) { }

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

  async getActorActivityStats(
    organizationId: string,
    actorId: string,
    period: ActorActivityPeriod,
  ): Promise<ActorActivityStats> {
    const truncUnit = period === ActorActivityPeriod.LAST_24_HOURS ? 'hour' : 'day';
    const bucketCount = period === ActorActivityPeriod.LAST_24_HOURS ? 24 : 7;

    const now = new Date();
    const currentBucketStart = new Date(now);
    if (truncUnit === 'hour') {
      currentBucketStart.setMinutes(0, 0, 0);
    } else {
      currentBucketStart.setHours(0, 0, 0, 0);
    }

    const rangeStart = new Date(currentBucketStart);
    if (truncUnit === 'hour') {
      rangeStart.setHours(rangeStart.getHours() - (bucketCount - 1));
    } else {
      rangeStart.setDate(rangeStart.getDate() - (bucketCount - 1));
    }

    const rows = await this.auditLogModel.findAll({
      attributes: [
        [fn('date_trunc', truncUnit, col('createdAt')), 'bucket'],
        [fn('COUNT', col('id')), 'count'],
      ],
      where: {
        organizationId,
        actorId,
        createdAt: { [Op.gte]: rangeStart },
      },
      group: [fn('date_trunc', truncUnit, col('createdAt'))],
      raw: true,
    });

    const countsByBucket = new Map<string, number>();
    for (const row of rows as unknown as { bucket: Date; count: string }[]) {
      countsByBucket.set(new Date(row.bucket).toISOString(), Number(row.count));
    }

    const buckets: ActorActivityBucket[] = [];
    let total = 0;

    for (let i = bucketCount - 1; i >= 0; i--) {
      const bucketDate = new Date(currentBucketStart);
      if (truncUnit === 'hour') {
        bucketDate.setHours(bucketDate.getHours() - i);
      } else {
        bucketDate.setDate(bucketDate.getDate() - i);
      }

      const key = bucketDate.toISOString();
      const count = countsByBucket.get(key) ?? 0;
      total += count;

      buckets.push({
        label:
          truncUnit === 'hour'
            ? bucketDate.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true })
            : bucketDate.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            }),
        timestamp: bucketDate,
        count,
      });
    }

    return {
      actorId,
      period,
      total,
      buckets,
    };
  }
}
