import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import {
  PAYMENT_SERVICE_NAME,
  ListPaymentsRequest,
  ListPaymentsResponse,
} from '@demo/contracts';
import { PaymentService } from './payment.service';

@Controller()
export class PaymentController {
  constructor(private readonly payments: PaymentService) {}

  @GrpcMethod(PAYMENT_SERVICE_NAME, 'ListPayments')
  async listPayments(req: ListPaymentsRequest): Promise<ListPaymentsResponse> {
    return { payments: await this.payments.listByOrder(req.orderId) };
  }
}