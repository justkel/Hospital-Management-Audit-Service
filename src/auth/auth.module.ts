import { Module } from '@nestjs/common';
import { JwtKeyService } from './jwt-key.service';
import { JwtServiceHelper } from './jwt.service.helper';
import { JWT_KEY_SERVICE } from '@justkel/shared';

@Module({
  providers: [
    JwtKeyService,
    JwtServiceHelper,
    {
      provide: JWT_KEY_SERVICE,
      useExisting: JwtKeyService,
    },
  ],
  exports: [JWT_KEY_SERVICE, JwtServiceHelper],
})
export class AuthModule {}