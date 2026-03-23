import { ConfigService } from '@nestjs/config';
import { BankIdCompletionService } from './bankid-completion.service';
import { BankIdService } from './bankid.service';
import { BankIdOrderStoreService } from './bankid-order-store.service';
import { BankIdQrService } from './bankid-qr.service';
import { BankIdRpApiClient } from './bankid-rp-api.client';

describe('BankIdService', () => {
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
  const completionService = new BankIdCompletionService();

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

  function createOrderStore() {
    return new BankIdOrderStoreService(configService);
  }

  it('returns same-device launch data and saves the order', async () => {
    const orderStore = createOrderStore();
    const qrService = new BankIdQrService(configService);
    const service = new BankIdService(
      configService,
      bankIdRpApiClient,
      orderStore,
      qrService,
      completionService,
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
    const orderStore = createOrderStore();
    const qrService = new BankIdQrService(configService);
    const service = new BankIdService(
      configService,
      bankIdRpApiClient,
      orderStore,
      qrService,
      completionService,
    );

    const response = await service.startAuth({ flow: 'qr' }, '127.0.0.1');

    expect(response.flow).toBe('qr');
    expect(response.qr?.imageDataUrl.startsWith('data:image/png;base64,')).toBe(true);
    expect(response.qr?.refreshIntervalMs).toBe(1000);
    expect(response.status.message).toBe('Open your BankID app to continue.');
  });

  it('progresses a same-device order through collect states', async () => {
    const orderStore = createOrderStore();
    const qrService = new BankIdQrService(configService);
    const service = new BankIdService(
      configService,
      bankIdRpApiClient,
      orderStore,
      qrService,
      completionService,
    );

    const response = await service.startAuth({ flow: 'same-device' }, '127.0.0.1');

    orderStore.update(response.orderId, {
      startedAt: new Date(Date.now() - 5_000).toISOString(),
    });
    const pendingStatus = await service.getOrderStatus(response.orderId);

    expect(pendingStatus.state).toBe('pending');
    expect(pendingStatus.hintCode).toBe('userSign');

    orderStore.update(response.orderId, {
      startedAt: new Date(Date.now() - 8_500).toISOString(),
      lastCollectedAt: new Date(Date.now() - 3_000).toISOString(),
    });
    const completeStatus = await service.getOrderStatus(response.orderId);

    expect(completeStatus.state).toBe('complete');
    expect(completeStatus.completion?.user.name).toBe('Test User');
  });

  it('progresses a qr order to completion with refreshed QR data', async () => {
    const orderStore = createOrderStore();
    const qrService = new BankIdQrService(configService);
    const service = new BankIdService(
      configService,
      bankIdRpApiClient,
      orderStore,
      qrService,
      completionService,
    );

    const response = await service.startAuth({ flow: 'qr' }, '127.0.0.1');

    orderStore.update(response.orderId, {
      startedAt: new Date(Date.now() - 3_000).toISOString(),
    });
    const pendingStatus = await service.getOrderStatus(response.orderId);

    expect(pendingStatus.state).toBe('pending');
    expect(pendingStatus.qr?.imageDataUrl.startsWith('data:image/png;base64,')).toBe(true);

    orderStore.update(response.orderId, {
      startedAt: new Date(Date.now() - 9_000).toISOString(),
      lastCollectedAt: new Date(Date.now() - 3_000).toISOString(),
    });
    const completeStatus = await service.getOrderStatus(response.orderId);

    expect(completeStatus.state).toBe('complete');
    expect(completeStatus.qr).toBeUndefined();
  });

  it('cancels a pending order and returns cancelled state', async () => {
    const orderStore = createOrderStore();
    const qrService = new BankIdQrService(configService);
    const service = new BankIdService(
      configService,
      bankIdRpApiClient,
      orderStore,
      qrService,
      completionService,
    );

    const response = await service.startAuth({ flow: 'same-device' }, '127.0.0.1');
    const cancelled = await service.cancelOrder(response.orderId, {
      reason: 'user requested',
    });

    expect(cancelled.state).toBe('cancelled');
    expect(cancelled.hintCode).toBe('userCancel');
    expect(cancelled.message).toBe('The BankID authentication was cancelled.');
  });

  it('returns not found after an order has expired out of the store', async () => {
    const orderStore = createOrderStore();
    const qrService = new BankIdQrService(configService);
    const service = new BankIdService(
      configService,
      bankIdRpApiClient,
      orderStore,
      qrService,
      completionService,
    );

    const response = await service.startAuth({ flow: 'same-device' }, '127.0.0.1');
    orderStore.pruneExpiredOrders(new Date(Date.now() + 301_000));

    await expect(service.getOrderStatus(response.orderId)).rejects.toThrow(
      'BankID order not found.',
    );
  });
});
