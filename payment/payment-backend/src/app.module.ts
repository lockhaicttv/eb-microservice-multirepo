import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KafkaCoreModule } from './kafka/kafka-core.module';
import { OrkesModule } from './modules/orkes/orkes.module';
import { PaymentModule } from './modules/payment/payment.module';
import { RefundModule } from './modules/refund/refund.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    KafkaCoreModule,
    OrkesModule,
    PaymentModule,
    RefundModule,
  ],
})
export class AppModule {}