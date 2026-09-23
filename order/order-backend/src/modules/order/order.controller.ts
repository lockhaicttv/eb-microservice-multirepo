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
  getOrder(req: GetOrderRequest): GetOrderResponse {
    return { order: this.orders.get(req.orderId) };
  }

  @GrpcMethod(ORDER_SERVICE_NAME, 'ListOrders')
  listOrders(req: ListOrdersRequest): ListOrdersResponse {
    return { orders: this.orders.listByUser(req.userId) };
  }
}