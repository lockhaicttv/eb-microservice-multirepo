import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  AUTH_SERVICE_NAME,
  AuthServiceClient,
  USER_ROLES,
  User,
  UserRole,
  isRole,
} from '@demo/contracts';

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

  /**
   * Resolve a token to the current user, role included.
   *
   * This is the only source of role truth in this BFF. The JWT payload carries
   * no role claim, so a promotion or demotion is reflected on the very next
   * request rather than after the token expires.
   */
  async validateToken(accessToken: string): Promise<User | null> {
    const res = await firstValueFrom(this.client.validateToken({ accessToken }));
    if (!res.valid || !res.user) return null;
    return withSafeRole(res.user);
  }

  async listUsers(accessToken: string): Promise<User[]> {
    const res = await firstValueFrom(this.client.listUsers({ accessToken }));
    return (res.users ?? []).map(withSafeRole);
  }

  async setUserRole(accessToken: string, userId: string, role: UserRole): Promise<User | null> {
    const res = await firstValueFrom(this.client.setUserRole({ accessToken, userId, role }));
    return res.user ? withSafeRole(res.user) : null;
  }
}

/**
 * Fail closed: a role this build does not recognise degrades to CUSTOMER, so a
 * newer backend cannot accidentally grant an older frontend more capability.
 */
function withSafeRole(user: User): User {
  return { ...user, role: isRole(user.role) ? user.role : USER_ROLES.CUSTOMER };
}