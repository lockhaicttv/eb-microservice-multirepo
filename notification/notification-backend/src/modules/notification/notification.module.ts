import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationEntity } from '../../database/entities/notification.entity';
import { NotificationService } from './notification.service';
import { NotificationRepository } from './notification.repository';
import { RefundNotifyRefundedHandler } from '../orkes/handlers/refund/refund-notify-refunded.handler';
import { RefundNotifyRejectedHandler } from '../orkes/handlers/refund/refund-notify-rejected.handler';

@Module({
  imports: [TypeOrmModule.forFeature([NotificationEntity])],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NotificationRepository,
    RefundNotifyRefundedHandler,
    RefundNotifyRejectedHandler,
  ],
})
export class NotificationModule {}
