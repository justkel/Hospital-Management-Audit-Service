import { Module } from '@nestjs/common';
import { JwtKeyService } from './jwt-key.service';
import { JwtServiceHelper } from './jwt.service.helper';
import { JWT_KEY_SERVICE } from '@justkel/shared';
import { TokenBlacklistService } from 'src/services/token-blacklist.service';

@Module({
  providers: [
    JwtKeyService,
    JwtServiceHelper,
    {
      provide: JWT_KEY_SERVICE,
      useExisting: JwtKeyService,
    },
    TokenBlacklistService,
  ],
  exports: [JWT_KEY_SERVICE, JwtServiceHelper, TokenBlacklistService],
})
export class AuthModule {}