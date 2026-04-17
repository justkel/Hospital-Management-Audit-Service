import { Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditResolver } from './audit.resolver';
import { AuditLog } from 'src/entities/audit-log.entity';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuditConsumer } from 'src/modules/audit/audit.consumer';
import { AuthModule } from 'src/auth/auth.module';
import { join } from 'path';
import { AuthClient } from 'src/sdk/auth.client';
import { GqlJwtAuthGuardWithPV } from 'src/common/guards/gql-auth-with-pv.guard';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { GqlJwtAuthGuard } from '@justkel/shared';

@Module({
  imports: [SequelizeModule.forFeature([AuditLog]), AuthModule, ClientsModule.register([
    {
      name: 'AUTH_GRPC',
      transport: Transport.GRPC,
      options: {
        package: 'auth',
        protoPath: join(process.cwd(), 'src/grpc/auth.proto'),
        url: 'auth-service:50051',
      },
    },
  ]),],
  providers: [AuditService, AuditResolver, AuthClient, GqlJwtAuthGuardWithPV, GqlJwtAuthGuard],
  controllers: [AuditConsumer],
  exports: [AuthClient],
})
export class AuditModule {}
