import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { AUTH_SERVICE_NAME, AuthServiceClient, User } from '@demo/contracts';

@Injectable()
export class AuthGatewayService implements OnModuleInit {
  private client!: AuthServiceClient;

  constructor(@Inject(AUTH_SERVICE_NAME) private readonly clients: ClientGrpc) {}

  onModuleInit() {
    this.client = this.clients.getService<AuthServiceClient>(AUTH_SERVICE_NAME);
  }

  async register(email: string, password: string, name: string) {
    return firstValueFrom(this.client.register({ email, password, name }));
  }

  async login(email: string, password: string) {
    return firstValueFrom(this.client.login({ email, password }));
  }

  async validateToken(accessToken: string): Promise<User | null> {
    const res = await firstValueFrom(this.client.validateToken({ accessToken }));
    return res.valid && res.user ? res.user : null;
  }
}