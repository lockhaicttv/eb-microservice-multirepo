import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TaskRunnerService } from './task-runner.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [TaskRunnerService],
  exports: [TaskRunnerService],
})
export class WorkerModule {}
