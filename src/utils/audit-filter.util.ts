import { Op, WhereAttributeHashValue } from 'sequelize';
import { AuditDateFilter } from 'src/enums/audit-log.enum';

interface DateFilterParams {
  dateFilter?: AuditDateFilter;
  startDate?: Date;
  endDate?: Date;
}

export function buildAuditDateFilter({
  dateFilter,
  startDate,
  endDate,
}: DateFilterParams): WhereAttributeHashValue<Date> | undefined {
  if (!dateFilter) return undefined;

  const now = new Date();

  switch (dateFilter) {
    case AuditDateFilter.TODAY: {
      const start = new Date();
      start.setHours(0, 0, 0, 0);

      const end = new Date();
      end.setHours(23, 59, 59, 999);

      return { [Op.between]: [start, end] };
    }

    case AuditDateFilter.THIS_WEEK: {
      const start = new Date(now);
      const day = start.getDay();
      start.setDate(start.getDate() - day);
      start.setHours(0, 0, 0, 0);

      const end = new Date();
      end.setHours(23, 59, 59, 999);

      return { [Op.between]: [start, end] };
    }

    case AuditDateFilter.THIS_MONTH: {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      start.setHours(0, 0, 0, 0);

      const end = new Date();
      end.setHours(23, 59, 59, 999);

      return { [Op.between]: [start, end] };
    }

    case AuditDateFilter.CUSTOM: {
      if (!startDate || !endDate) return undefined;

      return {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    default:
      return undefined;
  }
}
