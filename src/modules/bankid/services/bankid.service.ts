import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BankIdOrderStoreService } from './bankid-order-store.service';
import { BankIdQrService } from './bankid-qr.service';
import { BankIdRpApiClient } from './bankid-rp-api.client';

@Injectable()
export class BankIdService {
  constructor(
    private readonly configService: ConfigService,
    private readonly bankIdRpApiClient: BankIdRpApiClient,
    private readonly bankIdOrderStoreService: BankIdOrderStoreService,
    private readonly bankIdQrService: BankIdQrService,
  ) {}

  getFoundationStatus() {
    const diagnostics = this.bankIdRpApiClient.getDiagnostics();
    const ready =
      !diagnostics.enabled ||
      (diagnostics.certificateLoaded && diagnostics.caLoaded);

    return {
      ready,
      mode: diagnostics.enabled ? ('configured' as const) : ('disabled' as const),
      apiBaseUrl: diagnostics.apiBaseUrl,
      rpApiPrefix: diagnostics.rpApiPrefix,
      frontendBaseUrl:
        this.configService.getOrThrow<string>('FRONTEND_BASE_URL'),
      requestTimeoutMs: diagnostics.requestTimeoutMs,
      collectIntervalMs: this.configService.getOrThrow<number>(
        'BANKID_COLLECT_INTERVAL_MS',
      ),
      qrRefreshIntervalMs: this.bankIdQrService.getRefreshIntervalMs(),
      orderTtlSeconds: this.configService.getOrThrow<number>(
        'BANKID_ORDER_TTL_SECONDS',
      ),
      mtls: {
        certificateLoaded: diagnostics.certificateLoaded,
        caLoaded: diagnostics.caLoaded,
      },
      orderStore: {
        activeOrders: this.bankIdOrderStoreService.getCount(),
      },
    };
  }
}
