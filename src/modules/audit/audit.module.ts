import { Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditResolver } from './audit.resolver';
import { AuditLog } from 'src/entities/audit-log.entity';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuditConsumer } from 'src/modules/audit/audit.consumer';
import { AuthModule } from 'src/auth/auth.module';
import { join } from 'path';
import { AuthClient } from 'src/sdk/auth.client';
import { StaffClient } from 'src/sdk/staff.client';
import { GqlJwtAuthGuardWithPV } from 'src/common/guards/gql-auth-with-pv.guard';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { GqlJwtAuthGuard, RMQ_QUEUES } from '@justkel/shared';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    SequelizeModule.forFeature([AuditLog]),
    AuthModule,

    ClientsModule.registerAsync([
      {
        name: 'HOSPITAL_MAIN_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [config.get<string>('RABBITMQ_URL')],
            queue: RMQ_QUEUES.HOSPITAL_MAIN,
            queueOptions: { durable: true },
          },
        }),
      },
    ]),
    ClientsModule.register([
      {
        name: 'AUTH_GRPC',
        transport: Transport.GRPC,
        options: {
          package: 'auth',
          protoPath: join(process.cwd(), 'src/grpc/auth.proto'),
          url: 'auth-service:50051',
        },
      },
      {
        name: 'STAFF_GRPC',
        transport: Transport.GRPC,
        options: {
          package: 'staff',
          protoPath: join(process.cwd(), 'src/grpc/staff.proto'),
          url: 'main-service:50052',
        },
      },
    ]),
  ],
  providers: [
    AuditService,
    AuditResolver,
    AuthClient,
    StaffClient,
    GqlJwtAuthGuardWithPV,
    GqlJwtAuthGuard,
  ],
  controllers: [AuditConsumer],
  exports: [AuthClient, StaffClient],
})
export class AuditModule {}