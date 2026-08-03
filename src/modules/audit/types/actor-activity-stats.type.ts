import { ObjectType, Field, Int } from '@nestjs/graphql';
import { ActorActivityPeriod } from 'src/enums/audit-log.enum';

@ObjectType()
export class ActorActivityBucket {
  @Field()
  label: string;

  @Field()
  timestamp: Date;

  @Field(() => Int)
  count: number;
}

@ObjectType()
export class ActorActivityStats {
  @Field()
  actorId: string;

  @Field(() => ActorActivityPeriod)
  period: ActorActivityPeriod;

  @Field(() => Int)
  total: number;

  @Field(() => [ActorActivityBucket])
  buckets: ActorActivityBucket[];
}