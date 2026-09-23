import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KafkaCoreModule } from './kafka/kafka-core.module';
import { OrkesModule } from './modules/orkes/orkes.module';
import { OrderModule } from './modules/order/order.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    KafkaCoreModule,
    OrkesModule,
    OrderModule,
  ],
})
export class AppModule {}