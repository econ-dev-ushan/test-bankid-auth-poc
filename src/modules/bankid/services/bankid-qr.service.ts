import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BankIdQrService {
  constructor(private readonly configService: ConfigService) {}

  getRefreshIntervalMs() {
    return this.configService.getOrThrow<number>('BANKID_QR_REFRESH_INTERVAL_MS');
  }
}
