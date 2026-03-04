import { ObjectType, Field, ID } from '@nestjs/graphql';
import {
  Table,
  Column,
  DataType,
  Model,
  PrimaryKey,
  Default,
  AllowNull,
} from 'sequelize-typescript';
import { GraphQLJSON } from 'graphql-type-json';

@ObjectType()
@Table({
  tableName: 'audit_logs',
  timestamps: true,
  paranoid: false,
})
export class AuditLog extends Model {
  @Field(() => ID)
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @Field()
  @AllowNull(false)
  @Column(DataType.UUID)
  organizationId: string;

  @Field({ nullable: true })
  @Column(DataType.UUID)
  actorId?: string;

  @Field({ nullable: true })
  @Column(DataType.STRING)
  actorType?: string;

  @Field({ nullable: true })
  @Column(DataType.STRING)
  actorDescription?: string;

  @Field()
  @AllowNull(false)
  @Column(DataType.STRING)
  action: string;

  @Field()
  @AllowNull(false)
  @Column(DataType.STRING)
  entity: string;

  @Field()
  @AllowNull(false)
  @Column(DataType.STRING)
  appName: string;

  @Field({ nullable: true })
  @Column(DataType.STRING)
  entityId?: string;

  @Field(() => GraphQLJSON, { nullable: true })
  @Column(DataType.JSONB)
  metadata?: Record<string, any>;

  @Field()
  @Column(DataType.DATE)
  createdAt: Date;

  @Field()
  @Column(DataType.DATE)
  updatedAt: Date;
}
