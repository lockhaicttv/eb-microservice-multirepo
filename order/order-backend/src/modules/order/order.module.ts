import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CATALOG_SERVICE_NAME, PACKAGE_NAME, demoProtoPath } from '@demo/contracts';
import { OrderEntity } from '../../database/entities/order.entity';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { OrderRepository } from './order.repository';
import { RefundWorkerService } from '../orkes/refund-worker.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrderEntity]),
    ClientsModule.register([
      {
        name: CATALOG_SERVICE_NAME,
        transport: Transport.GRPC,
        options: {
          package: PACKAGE_NAME,
          protoPath: demoProtoPath(),
          url: process.env.CATALOG_GRPC_URL ?? 'localhost:5102',
          loader: { keepCase: false, longs: Number, enums: String, defaults: true, oneofs: true },
        },
      },
    ]),
  ],
  controllers: [OrderController],
  providers: [OrderService, OrderRepository, RefundWorkerService],
})
export class OrderModule {}