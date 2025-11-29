import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { GraphQLModule } from '@nestjs/graphql';
import {
  ApolloFederationDriver,
  ApolloFederationDriverConfig,
} from '@nestjs/apollo';
import { join } from 'path';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuditLog } from './entities/audit-log.entity';
import { AuditModule } from './modules/audit/audit.module';
import { CoreModule } from './core.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        dialect: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: Number(config.get<number>('DB_PORT')),
        username: config.get<string>('DB_USER'),
        password: (config.get<string>('DB_PASS') ?? '').replace(
          /^"(.*)"$/,
          '$1',
        ),
        database: config.get<string>('DB_NAME'),
        models: [AuditLog],
        autoLoadModels: true,
        synchronize: false,
        logging: false,
      }),
    }),

    GraphQLModule.forRoot<ApolloFederationDriverConfig>({
      driver: ApolloFederationDriver,
      autoSchemaFile: {
        federation: 2,
        path: join(process.cwd(), 'src/schema.gql'),
      },
      sortSchema: true,
      playground: true,
    }),
    AuditModule,
    CoreModule,
  ],
})
export class AppModule {}
