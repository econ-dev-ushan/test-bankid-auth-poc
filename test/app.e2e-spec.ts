import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';

describe('App and BankID flow (e2e)', () => {
  let app: INestApplication<App>;
  let AppModule: (typeof import('./../src/app.module'))['AppModule'];
  let BankIdOrderStoreService: (typeof import('./../src/modules/bankid/services/bankid-order-store.service'))['BankIdOrderStoreService'];
  let moduleFixture: TestingModule;
  let originalEnv: NodeJS.ProcessEnv;

  beforeAll(() => {
    originalEnv = { ...process.env };
    process.env.NODE_ENV = 'test';
    process.env.FRONTEND_BASE_URL = 'http://localhost:5173';
    process.env.BANKID_ENABLED = 'false';
    process.env.BANKID_API_BASE_URL = 'https://appapi2.test.bankid.com';
    process.env.BANKID_RP_API_PREFIX = '/rp/v6.0';
    process.env.BANKID_REQUEST_TIMEOUT_MS = '10000';
    process.env.BANKID_COLLECT_INTERVAL_MS = '2000';
    process.env.BANKID_QR_REFRESH_INTERVAL_MS = '1000';
    process.env.BANKID_ORDER_TTL_SECONDS = '300';
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  beforeEach(async () => {
    jest.resetModules();
    ({ AppModule } = require('./../src/app.module'));
    ({ BankIdOrderStoreService } = require('./../src/modules/bankid/services/bankid-order-store.service'));

    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('/api/bankid/health (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/bankid/health')
      .expect(200);

    expect(response.body).toMatchObject({
      ready: true,
      mode: 'disabled',
      frontendBaseUrl: 'http://localhost:5173',
      collectIntervalMs: 2000,
      qrRefreshIntervalMs: 1000,
      orderStore: {
        activeOrders: 0,
      },
      mtls: {
        certificateLoaded: false,
        caLoaded: false,
      },
    });
  });

  it('starts a same-device order and returns a launch payload', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/bankid/auth')
      .send({ flow: 'same-device' })
      .expect(201);

    expect(response.body).toMatchObject({
      flow: 'same-device',
      status: {
        state: 'pending',
        hintCode: 'outstandingTransaction',
      },
      launch: {
        autoStartToken: expect.any(String),
        bankIdUrl: expect.stringContaining('bankid:///?autostarttoken='),
      },
    });
    expect(response.body.qr).toBeUndefined();
  });

  it('returns QR status data and completion once a QR order is collected to success', async () => {
    const authResponse = await request(app.getHttpServer())
      .post('/api/bankid/auth')
      .send({ flow: 'qr' })
      .expect(201);

    const orderStore = moduleFixture.get(BankIdOrderStoreService);
    orderStore.update(authResponse.body.orderId, {
      startedAt: new Date(Date.now() - 9000).toISOString(),
      lastCollectedAt: undefined,
    });

    const statusResponse = await request(app.getHttpServer())
      .get(`/api/bankid/orders/${authResponse.body.orderId}`)
      .expect(200);

    expect(statusResponse.body).toMatchObject({
      orderId: authResponse.body.orderId,
      flow: 'qr',
      state: 'complete',
      hintCode: null,
      completion: {
        user: {
          personalNumber: '199001011234',
          name: 'Test User',
        },
        bankId: {
          orderRef: expect.any(String),
        },
      },
    });
    expect(statusResponse.body.qr).toBeUndefined();
  });

  it('cancels a pending order and returns the normalized cancelled state', async () => {
    const authResponse = await request(app.getHttpServer())
      .post('/api/bankid/auth')
      .send({ flow: 'qr' })
      .expect(201);

    const cancelResponse = await request(app.getHttpServer())
      .post(`/api/bankid/orders/${authResponse.body.orderId}/cancel`)
      .send({ reason: 'user-aborted' })
      .expect(201);

    expect(cancelResponse.body).toMatchObject({
      orderId: authResponse.body.orderId,
      flow: 'qr',
      state: 'cancelled',
      hintCode: 'userCancel',
      message: expect.any(String),
    });

    const statusResponse = await request(app.getHttpServer())
      .get(`/api/bankid/orders/${authResponse.body.orderId}`)
      .expect(200);

    expect(statusResponse.body.state).toBe('cancelled');
    expect(statusResponse.body.hintCode).toBe('userCancel');
  });

  it('returns not found after an order expires out of the in-memory store', async () => {
    const authResponse = await request(app.getHttpServer())
      .post('/api/bankid/auth')
      .send({ flow: 'same-device' })
      .expect(201);

    const orderStore = moduleFixture.get(BankIdOrderStoreService);
    orderStore.pruneExpiredOrders(new Date(Date.now() + 301_000));

    const statusResponse = await request(app.getHttpServer())
      .get(`/api/bankid/orders/${authResponse.body.orderId}`)
      .expect(404);

    expect(statusResponse.body.message).toBe('BankID order not found.');
  });

  it('rejects unsupported flow values with validation errors', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/bankid/auth')
      .send({ flow: 'unsupported' })
      .expect(400);

    expect(response.body.message).toContain(
      'flow must be one of the following values: same-device, qr',
    );
  });
});
