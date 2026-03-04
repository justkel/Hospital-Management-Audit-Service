import { InputType, Field, Int, ObjectType } from '@nestjs/graphql';
import { AuditLog } from 'src/entities/audit-log.entity';
import { AuditDateFilter } from 'src/enums/audit-log.enum';

export type ClassType<T = any> = new (...args: any[]) => T;

export function Paginated<TItem>(TClass: ClassType<TItem>): any {
  @ObjectType({ isAbstract: true })
  abstract class PaginatedType {
    @Field(() => [TClass])
    items: TItem[];

    @Field(() => Int)
    total: number;

    @Field(() => Int)
    page: number;

    @Field(() => Int)
    pageCount: number;
  }
  return PaginatedType;
}

@InputType()
export class AuditPaginationInput {
  @Field()
  page: number;

  @Field()
  limit: number;

  @Field({ nullable: true })
  action?: string;

  @Field({ nullable: true })
  actorId?: string;

  @Field({ nullable: true })
  entity?: string;

  @Field(() => AuditDateFilter, { nullable: true })
  dateFilter?: AuditDateFilter;

  @Field(() => Date, { nullable: true })
  startDate?: Date;

  @Field(() => Date, { nullable: true })
  endDate?: Date;
}

@ObjectType()
export class AuditPaginationResult extends Paginated(AuditLog) {}
