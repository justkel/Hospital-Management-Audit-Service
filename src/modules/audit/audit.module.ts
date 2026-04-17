import { Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditResolver } from './audit.resolver';
import { AuditLog } from 'src/entities/audit-log.entity';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuditConsumer } from 'src/modules/audit/audit.consumer';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [SequelizeModule.forFeature([AuditLog]), AuthModule],
  providers: [AuditService, AuditResolver],
  controllers: [AuditConsumer],
})
export class AuditModule {}
