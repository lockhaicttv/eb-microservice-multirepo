import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentEntity } from '../../database/payment.entity';
import { PaymentService } from './payment.service';
import { PaymentStore } from './payment.store';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentEntity])],
  controllers: [PaymentController],
  providers: [PaymentService, PaymentStore],
})
export class PaymentModule {}