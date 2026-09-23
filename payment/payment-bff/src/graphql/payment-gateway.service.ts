import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { PAYMENT_SERVICE_NAME, PaymentServiceClient } from '@demo/contracts';

@Injectable()
export class PaymentGatewayService implements OnModuleInit {
  private client!: PaymentServiceClient;

  constructor(@Inject(PAYMENT_SERVICE_NAME) private readonly clients: ClientGrpc) {}

  onModuleInit() {
    this.client = this.clients.getService<PaymentServiceClient>(PAYMENT_SERVICE_NAME);
  }

  async listPayments(orderId: string) {
    const res = await firstValueFrom(this.client.listPayments({ orderId }));
    return res.payments;
  }
}