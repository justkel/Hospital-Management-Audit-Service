import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Global()
@Module({
  providers: [
    {
      provide: 'JWT_PUBLIC_KEY',
      useFactory: (config: ConfigService) =>
        config.get<string>('JWT_PUBLIC_KEY').replace(/\\n/g, '\n'),
      inject: [ConfigService],
    },
  ],
  exports: ['JWT_PUBLIC_KEY'],
})
export class CoreModule {}
