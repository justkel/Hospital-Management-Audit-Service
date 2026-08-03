import { registerEnumType } from '@nestjs/graphql';

export enum AuditDistinctField {
  ACTION = 'action',
  ACTOR_ID = 'actorId',
  ENTITY = 'entity',
}

registerEnumType(AuditDistinctField, {
  name: 'AuditDistinctField',
});

export enum AuditDateFilter {
  TODAY = 'TODAY',
  THIS_WEEK = 'THIS_WEEK',
  THIS_MONTH = 'THIS_MONTH',
  CUSTOM = 'CUSTOM',
}

registerEnumType(AuditDateFilter, {
  name: 'AuditDateFilter',
});

export enum ActorActivityPeriod {
  LAST_24_HOURS = 'LAST_24_HOURS',
  LAST_7_DAYS = 'LAST_7_DAYS',
}

registerEnumType(ActorActivityPeriod, {
  name: 'ActorActivityPeriod',
});