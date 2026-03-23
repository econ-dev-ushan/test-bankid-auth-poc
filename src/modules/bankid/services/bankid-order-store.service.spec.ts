import { ConfigService } from '@nestjs/config';
import { BankIdOrderStoreService } from './bankid-order-store.service';

describe('BankIdOrderStoreService', () => {
  const configService = new ConfigService({
    BANKID_ORDER_TTL_SECONDS: 60,
  });

  function createStore() {
    return new BankIdOrderStoreService(configService);
  }

  function createOrder(
    overrides: Partial<Parameters<BankIdOrderStoreService['save']>[0]> = {},
  ) {
    const now = Date.now();

    return {
      orderId: 'order-1',
      correlationId: 'corr-1',
      bankIdOrderRef: 'bankid-ref-1',
      flow: 'same-device' as const,
      status: 'pending' as const,
      hintCode: 'outstandingTransaction',
      message: 'Open your BankID app to continue.',
      startedAt: new Date(now).toISOString(),
      completionData: null,
      ...overrides,
    };
  }

  it('keeps active orders that are still inside the TTL window', () => {
    const store = createStore();
    store.save(createOrder());

    const removedCount = store.pruneExpiredOrders(new Date(Date.now() + 30_000));

    expect(removedCount).toBe(0);
    expect(store.get('order-1')).not.toBeNull();
    expect(store.getCount()).toBe(1);
  });

  it('prunes pending orders once they exceed the configured TTL', () => {
    const store = createStore();
    store.save(createOrder());

    const removedCount = store.pruneExpiredOrders(new Date(Date.now() + 61_000));

    expect(removedCount).toBe(1);
    expect(store.get('order-1')).toBeNull();
    expect(store.getCount()).toBe(0);
  });

  it('uses terminal timestamps when pruning completed orders', () => {
    const store = createStore();
    store.save(
      createOrder({
        status: 'complete',
        completedAt: new Date(Date.now()).toISOString(),
        startedAt: new Date(Date.now() - 300_000).toISOString(),
      }),
    );

    const removedCount = store.pruneExpiredOrders(new Date(Date.now() + 30_000));

    expect(removedCount).toBe(0);
    expect(store.get('order-1')).not.toBeNull();

    store.pruneExpiredOrders(new Date(Date.now() + 61_000));

    expect(store.get('order-1')).toBeNull();
  });

  it('uses failed timestamps when pruning failed orders', () => {
    const store = createStore();
    store.save(
      createOrder({
        status: 'failed',
        failedAt: new Date(Date.now()).toISOString(),
      }),
    );

    store.pruneExpiredOrders(new Date(Date.now() + 61_000));

    expect(store.get('order-1')).toBeNull();
  });
});
