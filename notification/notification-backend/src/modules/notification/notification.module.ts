import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationEntity } from '../../database/notification.entity';
import { NotificationService } from './notification.service';
import { NotificationStore } from './notification.store';

@Module({
  imports: [TypeOrmModule.forFeature([NotificationEntity])],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationStore],
})
export class NotificationModule {}