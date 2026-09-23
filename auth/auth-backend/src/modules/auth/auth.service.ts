import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@demo/contracts';

export interface StoredUser {
  user: User;
  password: string;
}

@Injectable()
export class UsersStore {
  private readonly users = new Map<string, StoredUser>();
  private seq = 0;

  constructor() {
    this.seed();
  }

  private seed() {
    this.add({ id: 'u-1', email: 'alice@demo.dev', name: 'Alice' }, 'alice123');
    this.add({ id: 'u-2', email: 'bob@demo.dev', name: 'Bob' }, 'bob123');
  }

  add(user: User, password: string): StoredUser {
    const id = user.id ?? `u-${++this.seq}`;
    const record = { user: { ...user, id }, password };
    this.users.set(id, record);
    return record;
  }

  findByEmail(email: string): StoredUser | undefined {
    const normalized = email.toLowerCase();
    for (const record of this.users.values()) {
      if (record.user.email.toLowerCase() === normalized) return record;
    }
    return undefined;
  }

  findById(id: string): StoredUser | undefined {
    return this.users.get(id);
  }
}

export interface TokenPayload {
  sub: string;
  email: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersStore,
    private readonly jwt: JwtService,
  ) {}

  register(email: string, password: string, name: string) {
    if (this.users.findByEmail(email)) {
      throw new Error('EMAIL_ALREADY_EXISTS');
    }
    const record = this.users.add({ id: `u-${Date.now()}`, email, name }, password);
    const token = this.jwt.sign(this.toPayload(record));
    return { accessToken: token, user: record.user };
  }

  login(email: string, password: string) {
    const record = this.users.findByEmail(email);
    if (!record || record.password !== password) {
      throw new Error('INVALID_CREDENTIALS');
    }
    const token = this.jwt.sign(this.toPayload(record));
    return { accessToken: token, user: record.user };
  }

  validateToken(accessToken: string) {
    try {
      const payload = this.jwt.verify<TokenPayload>(accessToken);
      const record = this.users.findById(payload.sub);
      if (!record) return { valid: false };
      return { valid: true, user: record.user };
    } catch {
      return { valid: false };
    }
  }

  private toPayload(record: StoredUser): TokenPayload {
    return { sub: record.user.id, email: record.user.email };
  }
}