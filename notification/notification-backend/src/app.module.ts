import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KafkaCoreModule } from './kafka/kafka-core.module';
import { OrkesModule } from './modules/orkes/orkes.module';
import { NotificationModule } from './modules/notification/notification.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    KafkaCoreModule,
    OrkesModule,
    NotificationModule,
  ],
})
export class AppModule {}