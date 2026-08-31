import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { AuditLog } from 'src/entities/audit-log.entity';
import { CreateAuditLogInput } from 'src/modules/audit/dto/create-audit-log.input';
import { Op, fn, col, literal } from 'sequelize';
import { ActorActivityPeriod, AuditDistinctField, PeakHoursPeriod } from 'src/enums/audit-log.enum';
import { buildAuditDateFilter } from 'src/utils/audit-filter.util';
import { AuditPaginationInput } from 'src/graphql/types/paginate.type';
import { ActorActivityStats, ActorActivityBucket } from './types/actor-activity-stats.type';
import { PeakHour, PeakHoursStats } from './types/peak-hours.type';

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

  async getPeakHoursStats(
    organizationId: string,
    period: PeakHoursPeriod,
  ): Promise<PeakHoursStats> {
    // Determine date range based on period
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch (period) {
      case PeakHoursPeriod.TODAY:
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        break;
      case PeakHoursPeriod.THIS_WEEK:
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay());
        startDate.setHours(0, 0, 0, 0);
        break;
      case PeakHoursPeriod.LAST_7_DAYS:
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        break;
      case PeakHoursPeriod.LAST_30_DAYS:
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);
        break;
      case PeakHoursPeriod.LAST_3_MONTHS:
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 3);
        startDate.setHours(0, 0, 0, 0);
        break;
      case PeakHoursPeriod.THIS_MONTH:
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate.setHours(0, 0, 0, 0);
        break;
    }

    const where: any = {
      organizationId,
      createdAt: {
        [Op.gte]: startDate,
        [Op.lte]: endDate,
      },
    };

    const auditTimeZone = process.env.AUDIT_TIMEZONE ?? 'Africa/Lagos';
    const localHourExpression = fn(
      'EXTRACT',
      literal(`HOUR FROM "createdAt" AT TIME ZONE '${auditTimeZone}'`),
    );
    const results = await this.auditLogModel.findAll({
      attributes: [
        [localHourExpression, 'hour'],
        [fn('COUNT', col('id')), 'count'],
      ],
      where,
      group: [localHourExpression],
      order: [[literal('hour'), 'ASC']],
      raw: true,
    });

    const totalCount = await this.auditLogModel.count({ where });

    const peakHours: PeakHour[] = [];
    let maxCount = 0;
    let busiestHour: PeakHour | null = null;

    for (let i = 0; i < 24; i++) {
      peakHours.push({
        hour: `${String(i).padStart(2, '0')}:00`,
        hourOfDay: i,
        count: 0,
        percentage: 0,
      });
    }

    for (const row of results as unknown as { hour: string; count: string }[]) {
      const hourIndex = parseInt(row.hour, 10);
      if (hourIndex >= 0 && hourIndex < 24) {
        const count = parseInt(row.count, 10);
        peakHours[hourIndex].count = count;
        peakHours[hourIndex].percentage = totalCount > 0
          ? parseFloat(((count / totalCount) * 100).toFixed(2))
          : 0;

        if (count > maxCount) {
          maxCount = count;
          busiestHour = { ...peakHours[hourIndex] };
        }
      }
    }

    const averagePerHour = Math.round(totalCount / 24);

    const offPeakHours = peakHours.filter(h => h.hourOfDay >= 22 || h.hourOfDay < 6);
    const offPeakTotal = offPeakHours.reduce((sum, h) => sum + h.count, 0);
    const offPeakAverage = offPeakHours.length > 0 ? Math.round(offPeakTotal / offPeakHours.length) : 0;

    const peakBusinessHours = peakHours.filter(h => h.hourOfDay >= 9 && h.hourOfDay < 17);
    const peakTotal = peakBusinessHours.reduce((sum, h) => sum + h.count, 0);
    const peakAverage = peakBusinessHours.length > 0 ? Math.round(peakTotal / peakBusinessHours.length) : 0;

    const percentPeak = totalCount > 0
      ? Math.round((peakTotal / totalCount) * 100)
      : 0;

    return {
      period,
      totalActivities: totalCount,
      peakHours,
      busiestHour,
      averagePerHour,
      offPeakAverage,
      peakAverage,
      percentPeak,
    };
  }
}
