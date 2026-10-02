import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import {
  AUTH_SERVICE_NAME,
  ListUsersRequest,
  ListUsersResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  SetUserRoleRequest,
  SetUserRoleResponse,
  ValidateTokenRequest,
  ValidateTokenResponse,
} from '@demo/contracts';
import { status as grpcStatus } from '@grpc/grpc-js';
import { AuthError, AuthErrorCode, AuthService } from './auth.service';

/**
 * Domain errors map to real gRPC status codes so callers can distinguish
 * UNAUTHENTICATED (401) from PERMISSION_DENIED (403) without parsing strings.
 */
const GRPC_STATUS_BY_CODE: Record<AuthErrorCode, grpcStatus> = {
  UNAUTHENTICATED: grpcStatus.UNAUTHENTICATED,
  PERMISSION_DENIED: grpcStatus.PERMISSION_DENIED,
  NOT_FOUND: grpcStatus.NOT_FOUND,
  INVALID_ARGUMENT: grpcStatus.INVALID_ARGUMENT,
  EMAIL_ALREADY_EXISTS: grpcStatus.ALREADY_EXISTS,
  // Deliberately INVALID_ARGUMENT, not UNAUTHENTICATED: a wrong password is a
  // bad request, and it must not be distinguishable from an unknown account.
  INVALID_CREDENTIALS: grpcStatus.INVALID_ARGUMENT,
};

const rethrow = (err: unknown, logger: Logger, label: string): never => {
  const message = err instanceof Error ? err.message : String(err);
  logger.warn(`${label} failed: ${message}`);

  if (err instanceof AuthError) {
    throw new RpcException({ code: GRPC_STATUS_BY_CODE[err.code], message });
  }
  // Unexpected error: keep internals out of the wire but log the real cause.
  logger.error(`${label} unexpected: ${message}`, err instanceof Error ? err.stack : undefined);
  throw new RpcException({ code: grpcStatus.INTERNAL, message: 'INTERNAL_ERROR' });
};

/**
 * Runs `fn` and converts any thrown AuthError into an RpcException with a real
 * gRPC status. Returns the resolved value, so the caller keeps its precise type.
 */
const handle = async <T>(logger: Logger, label: string, fn: () => Promise<T>): Promise<T> => {
  try {
    return await fn();
  } catch (err) {
    rethrow(err, logger, label);
    throw err; // unreachable; rethrow() always throws. Keeps the return type exact.
  }
};

@Controller()
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly auth: AuthService) {}

  @GrpcMethod(AUTH_SERVICE_NAME, 'Register')
  async register(req: RegisterRequest): Promise<RegisterResponse> {
    return handle(this.logger, 'register', () => this.auth.register(req.email, req.password, req.name));
  }

  @GrpcMethod(AUTH_SERVICE_NAME, 'Login')
  async login(req: LoginRequest): Promise<LoginResponse> {
    return handle(this.logger, 'login', () => this.auth.login(req.email, req.password));
  }

  @GrpcMethod(AUTH_SERVICE_NAME, 'ValidateToken')
  async validateToken(req: ValidateTokenRequest): Promise<ValidateTokenResponse> {
    // Never throws: an invalid or expired token is a normal answer here, not an
    // error, so every service polling this gets a clean { valid: false }.
    return this.auth.validateToken(req.accessToken ?? '');
  }

  @GrpcMethod(AUTH_SERVICE_NAME, 'ListUsers')
  async listUsers(req: ListUsersRequest): Promise<ListUsersResponse> {
    const users = await handle(this.logger, 'listUsers', () => this.auth.listUsers(req.accessToken ?? ''));
    return { users };
  }

  @GrpcMethod(AUTH_SERVICE_NAME, 'SetUserRole')
  async setUserRole(req: SetUserRoleRequest): Promise<SetUserRoleResponse> {
    const user = await handle(this.logger, 'setUserRole', () =>
      this.auth.setUserRole(req.accessToken ?? '', req.userId, req.role),
    );
    return { user };
  }
}