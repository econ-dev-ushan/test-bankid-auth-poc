import { Module } from '@nestjs/common';
import { BankIdController } from './controller/bankid.controller';
import { BankIdCompletionService } from './services/bankid-completion.service';
import { BankIdOrderStoreService } from './services/bankid-order-store.service';
import { BankIdQrService } from './services/bankid-qr.service';
import { BankIdRpApiClient } from './services/bankid-rp-api.client';
import { BankIdService } from './services/bankid.service';

@Module({
  controllers: [BankIdController],
  providers: [
    BankIdService,
    BankIdRpApiClient,
    BankIdOrderStoreService,
    BankIdQrService,
    BankIdCompletionService,
  ],
  exports: [BankIdService, BankIdOrderStoreService, BankIdRpApiClient],
})
export class BankIdModule {}
