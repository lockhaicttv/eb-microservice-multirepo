import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KafkaCoreModule } from './kafka/kafka-core.module';
import { OrkesModule } from './modules/orkes/orkes.module';
import { PaymentModule } from './modules/payment/payment.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    KafkaCoreModule,
    OrkesModule,
    PaymentModule,
  ],
})
export class AppModule {}