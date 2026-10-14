import { Module } from '@nestjs/common';
import { RefundRepository } from './refund.repository';
import { RefundIssueWorkerService } from '../orkes/refund-issue-worker.service';

@Module({
  providers: [RefundRepository, RefundIssueWorkerService],
  exports: [RefundRepository],
})
export class RefundModule {}
