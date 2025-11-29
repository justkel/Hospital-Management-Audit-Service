import { Field, InputType } from '@nestjs/graphql';
import { IsOptional, IsString, IsUUID, IsObject } from 'class-validator';

@InputType()
export class CreateAuditLogInput {
  @Field()
  @IsUUID()
  organizationId: string;

  @Field({ nullable: true })
  @IsUUID()
  @IsOptional()
  actorId?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  actorType?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  actorDescription?: string;

  @Field()
  @IsString()
  action: string;

  @Field()
  @IsString()
  entity: string;

  @Field()
  @IsString()
  appName: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  entityId?: string;

  @Field(() => String, { nullable: true })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
