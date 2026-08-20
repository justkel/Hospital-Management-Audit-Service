import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

interface GuestAccessStatusResponse {
  valid: boolean;
  reasonCode: string;
  requestId?: string;
}

interface StaffService {
  GetGuestAccessStatus(data: { staffId: string }): any;
}

@Injectable()
export class StaffClient implements OnModuleInit {
  private staffService: StaffService;

  constructor(
    @Inject('STAFF_GRPC')
    private client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.staffService = this.client.getService<StaffService>('StaffService');
  }

  async getGuestAccessStatus(staffId: string): Promise<GuestAccessStatusResponse> {
    return firstValueFrom(this.staffService.GetGuestAccessStatus({ staffId }));
  }
}