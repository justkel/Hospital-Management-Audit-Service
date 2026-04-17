import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '@justkel/shared';

@Injectable()
export class TokenBlacklistService {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async isBlacklisted(jti: string): Promise<boolean> {
    const exists = await this.redis.exists(`bl:${jti}`);
    return exists === 1;
}
}