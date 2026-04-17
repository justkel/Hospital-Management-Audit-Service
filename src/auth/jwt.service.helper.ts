import { Injectable } from '@nestjs/common';
import { JwtKeyService } from './jwt-key.service';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtServiceHelper {
  constructor(private readonly jwtKeyService: JwtKeyService) {}

  async verifyToken(token: string): Promise<any> {
    const publicKey = await this.jwtKeyService.getPublicKey();

    return jwt.verify(token, publicKey, {
      algorithms: ['RS256'],
    });
  }
}