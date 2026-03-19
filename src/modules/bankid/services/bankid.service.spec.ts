import { ConfigService } from '@nestjs/config';
import { BankIdService } from './bankid.service';
import { BankIdOrderStoreService } from './bankid-order-store.service';
import { BankIdQrService } from './bankid-qr.service';
import { BankIdRpApiClient } from './bankid-rp-api.client';

describe('BankIdService.startAuth', () => {
  const configService = new ConfigService({
    FRONTEND_BASE_URL: 'http://localhost:5173',
    BANKID_ENABLED: false,
    BANKID_API_BASE_URL: 'https://appapi2.test.bankid.com',
    BANKID_RP_API_PREFIX: '/rp/v6.0',
    BANKID_REQUEST_TIMEOUT_MS: 10000,
    BANKID_COLLECT_INTERVAL_MS: 2000,
    BANKID_QR_REFRESH_INTERVAL_MS: 1000,
    BANKID_ORDER_TTL_SECONDS: 300,
  });

  const bankIdRpApiClient = {
    getDiagnostics: () => ({
      enabled: false,
      apiBaseUrl: 'https://appapi2.test.bankid.com',
      rpApiPrefix: '/rp/v6.0',
      requestTimeoutMs: 10000,
      certificateLoaded: false,
      caLoaded: false,
    }),
  } as unknown as BankIdRpApiClient;

  it('returns same-device launch data and saves the order', async () => {
    const orderStore = new BankIdOrderStoreService();
    const qrService = new BankIdQrService(configService);
    const service = new BankIdService(
      configService,
      bankIdRpApiClient,
      orderStore,
      qrService,
    );

    const response = await service.startAuth(
      { flow: 'same-device' },
      '127.0.0.1',
    );

    expect(response.flow).toBe('same-device');
    expect(response.launch?.autoStartToken).toBeDefined();
    expect(response.launch?.bankIdUrl).toContain('bankid:///?');
    expect(response.status.state).toBe('pending');
    expect(orderStore.getCount()).toBe(1);
  });

  it('returns qr metadata for another-device flow', async () => {
    const orderStore = new BankIdOrderStoreService();
    const qrService = new BankIdQrService(configService);
    const service = new BankIdService(
      configService,
      bankIdRpApiClient,
      orderStore,
      qrService,
    );

    const response = await service.startAuth({ flow: 'qr' }, '127.0.0.1');

    expect(response.flow).toBe('qr');
    expect(response.qr?.imageDataUrl).toBeNull();
    expect(response.qr?.refreshIntervalMs).toBe(1000);
    expect(response.status.message).toBe('Open your BankID app to continue.');
  });
});
