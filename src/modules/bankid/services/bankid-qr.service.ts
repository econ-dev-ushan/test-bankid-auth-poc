import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'node:crypto';
import QRCode from 'qrcode';
import type { BankIdLocalOrder } from '../types/bankid.types';

@Injectable()
export class BankIdQrService {
  constructor(private readonly configService: ConfigService) {}

  getRefreshIntervalMs() {
    return this.configService.getOrThrow<number>('BANKID_QR_REFRESH_INTERVAL_MS');
  }

  async generateQrPayload(order: BankIdLocalOrder, now = new Date()) {
    if (
      order.flow !== 'qr' ||
      order.status !== 'pending' ||
      !order.qrStartToken ||
      !order.qrStartSecret
    ) {
      return undefined;
    }

    const qrData = this.generateQrData(order, now);
    const imageDataUrl = await QRCode.toDataURL(qrData, {
      margin: 1,
      width: 256,
      errorCorrectionLevel: 'M',
    });

    return {
      imageDataUrl,
      refreshIntervalMs: this.getRefreshIntervalMs(),
      refreshAt: new Date(now.getTime() + this.getRefreshIntervalMs()).toISOString(),
    };
  }

  generateQrData(order: Pick<BankIdLocalOrder, 'startedAt' | 'qrStartToken' | 'qrStartSecret'>, now = new Date()) {
    if (!order.qrStartToken || !order.qrStartSecret) {
      throw new Error('QR generation requires qrStartToken and qrStartSecret.');
    }

    const elapsedSeconds = this.getElapsedSeconds(order.startedAt, now);
    const qrAuthCode = createHmac('sha256', order.qrStartSecret)
      .update(String(elapsedSeconds))
      .digest('hex');

    return `bankid.${order.qrStartToken}.${elapsedSeconds}.${qrAuthCode}`;
  }

  private getElapsedSeconds(startedAt: string, now: Date) {
    const startedAtMs = new Date(startedAt).getTime();
    return Math.max(0, Math.floor((now.getTime() - startedAtMs) / 1000));
  }
}
