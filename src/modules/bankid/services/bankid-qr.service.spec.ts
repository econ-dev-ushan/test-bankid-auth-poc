import { ConfigService } from '@nestjs/config';
import { BankIdQrService } from './bankid-qr.service';

describe('BankIdQrService', () => {
  const qrService = new BankIdQrService(
    new ConfigService({
      BANKID_QR_REFRESH_INTERVAL_MS: 1000,
    }),
  );

  it('generates deterministic animated QR data', () => {
    const qrData = qrService.generateQrData(
      {
        startedAt: '2026-03-19T00:00:00.000Z',
        qrStartToken: 'token-123',
        qrStartSecret: 'secret-456',
      },
      new Date('2026-03-19T00:00:05.000Z'),
    );

    expect(qrData).toBe(
      'bankid.token-123.5.b1a4be7eb953d78d427719c3102f8b6c8133cfeb027081fb17bd7f155db17303',
    );
  });

  it('returns a QR payload for pending QR orders', async () => {
    const payload = await qrService.generateQrPayload({
      orderId: 'order-1',
      correlationId: 'corr-1',
      bankIdOrderRef: 'bankid-ref',
      flow: 'qr',
      status: 'pending',
      hintCode: 'outstandingTransaction',
      message: 'Open your BankID app to continue.',
      startedAt: '2026-03-19T00:00:00.000Z',
      qrStartToken: 'token-123',
      qrStartSecret: 'secret-456',
      completionData: null,
    });

    expect(payload?.imageDataUrl.startsWith('data:image/png;base64,')).toBe(true);
    expect(payload?.refreshIntervalMs).toBe(1000);
  });
});
