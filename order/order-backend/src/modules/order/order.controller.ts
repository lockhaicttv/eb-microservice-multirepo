import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import {
  ORDER_SERVICE_NAME,
  CreateOrderRequest,
  CreateOrderResponse,
  GetOrderRequest,
  GetOrderResponse,
  ListOrdersRequest,
  ListOrdersResponse,
} from '@demo/contracts';
import { status as grpcStatus } from '@grpc/grpc-js';
import { OrderService } from './order.service';

@Controller()
export class OrderController {
  private readonly logger = new Logger(OrderController.name);

  constructor(private readonly orders: OrderService) {}

  @GrpcMethod(ORDER_SERVICE_NAME, 'CreateOrder')
  async createOrder(req: CreateOrderRequest): Promise<CreateOrderResponse> {
    try {
      const order = await this.orders.create(req.userId, req.lineItems ?? []);
      return { order };
    } catch (err) {
      this.logger.error(`createOrder failed: ${(err as Error).message}`);
      throw new RpcException({ code: grpcStatus.INVALID_ARGUMENT, message: (err as Error).message });
    }
  }

  @GrpcMethod(ORDER_SERVICE_NAME, 'GetOrder')
  async getOrder(req: GetOrderRequest): Promise<GetOrderResponse> {
    return { order: await this.orders.get(req.orderId) };
  }

  @GrpcMethod(ORDER_SERVICE_NAME, 'ListOrders')
  async listOrders(req: ListOrdersRequest): Promise<ListOrdersResponse> {
    return { orders: await this.orders.listByUser(req.userId) };
  }
}