import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT, REDIS_KEYS } from '@justkel/shared';

@Injectable()
export class JwtKeyService {
  private cachedKey: string | null = null;
  private cacheTime = 0;

  private readonly CACHE_TTL = 60_000;

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async getPublicKey(): Promise<string> {
    const now = Date.now();

    if (this.cachedKey && now - this.cacheTime < this.CACHE_TTL) {
      return this.cachedKey;
    }

    let retries = 10;

    while (retries > 0) {
      const key = await this.redis.get(REDIS_KEYS.JWT_PUBLIC_KEY);

      if (key) {
        this.cachedKey = key;
        this.cacheTime = now;

        return key;
      }

      retries--;
      console.warn(
        `Waiting for JWT public key in Redis... (${retries} retries left)`,
      );

      await new Promise((res) => setTimeout(res, 500));
    }

    throw new Error('JWT public key not available in Redis after retries');
  }
}