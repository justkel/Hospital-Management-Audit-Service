import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';

interface AuthService {
  GetStaffById(data: { id: string }): any;
}

@Injectable()
export class AuthClient implements OnModuleInit {
  private authService: AuthService;

  constructor(@Inject('AUTH_GRPC') private client: ClientGrpc) {}

  onModuleInit() {
    this.authService = this.client.getService<AuthService>('AuthService');
  }

  async getStaffById(id: string) {
    const staff = await this.authService.GetStaffById({ id }).toPromise();

    if (!staff) {
      throw new Error('Staff not found');
    }

    return staff;
  }

  async hasRole(id: string, role: string) {
    const staff = await this.getStaffById(id);
    return staff.roles.includes(role);
  }

  async ensureActiveStaff(id: string) {
    const staff = await this.getStaffById(id);

    if (staff.status !== 'ACTIVE') {
      throw new Error('Staff is not active');
    }

    return staff;
  }
}