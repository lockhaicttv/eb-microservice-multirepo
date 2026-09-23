import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import {
  AUTH_SERVICE_NAME,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  ValidateTokenRequest,
  ValidateTokenResponse,
} from '@demo/contracts';
import { status as grpcStatus } from '@grpc/grpc-js';
import { AuthService } from './auth.service';

const toRpcError = (message: string) => new RpcException({ code: grpcStatus.INVALID_ARGUMENT, message });

@Controller()
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly auth: AuthService) {}

  @GrpcMethod(AUTH_SERVICE_NAME, 'Register')
  register(req: RegisterRequest): RegisterResponse {
    try {
      return this.auth.register(req.email, req.password, req.name);
    } catch (err) {
      this.logger.error(`register failed: ${(err as Error).message}`);
      throw toRpcError((err as Error).message);
    }
  }

  @GrpcMethod(AUTH_SERVICE_NAME, 'Login')
  login(req: LoginRequest): LoginResponse {
    try {
      return this.auth.login(req.email, req.password);
    } catch (err) {
      this.logger.error(`login failed: ${(err as Error).message}`);
      throw toRpcError((err as Error).message);
    }
  }

  @GrpcMethod(AUTH_SERVICE_NAME, 'ValidateToken')
  validateToken(req: ValidateTokenRequest): ValidateTokenResponse {
    return this.auth.validateToken(req.accessToken);
  }
}