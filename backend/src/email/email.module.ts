import { Logger, Module } from '@nestjs/common';

import { EmailFactory } from '@/email/domain/email.factory';

import { EmailService } from './email.service';

@Module({
  providers: [EmailService, Logger, EmailFactory],
  exports: [EmailService, EmailFactory],
})
export class EmailModule {}
