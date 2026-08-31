import { ObjectType, Field, Float, Int } from '@nestjs/graphql';

@ObjectType()
export class PeakHour {
  @Field()
  hour: string; // e.g., "09:00", "14:00"

  @Field()
  hourOfDay: number; // 0-23

  @Field(() => Int)
  count: number;

  @Field(() => Float)
  percentage: number; // Percentage of total activity for the period
}

@ObjectType()
export class PeakHoursStats {
  @Field()
  period: string;

  @Field(() => Int)
  totalActivities: number;

  @Field(() => [PeakHour])
  peakHours: PeakHour[];

  @Field(() => PeakHour, { nullable: true })
  busiestHour: PeakHour | null;

  @Field(() => Int)
  averagePerHour: number;

  @Field(() => Int)
  offPeakAverage: number; // Average of off-peak hours (10pm - 6am)

  @Field(() => Int)
  peakAverage: number; // Average of peak hours (9am - 5pm)

  @Field(() => Int)
  percentPeak: number; // Percentage of activity during peak hours (9am-5pm)
}