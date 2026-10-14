import { Module } from '@nestjs/common';
import { RefundRepository } from './refund.repository';
import { RefundIssuePaymentHandler } from '../orkes/handlers/refund/refund-issue-payment.handler';

@Module({
  providers: [RefundRepository, RefundIssuePaymentHandler],
  exports: [RefundRepository],
})
export class RefundModule {}
