import {
  BadGatewayException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { BankIdCompletionService } from './bankid-completion.service';
import { mapHintCodeToUserMessage } from '../utils/bankid-user-message.mapper';
import { buildBankIdLaunchUrl } from '../utils/bankid-launch-url';
import { mapCollectStatusToSnapshot } from '../utils/bankid-status.mapper';
import type {
  BankIdAuthApiResponse,
  BankIdCollectApiResponse,
  BankIdFlow,
  BankIdLocalOrder,
} from '../types/bankid.types';
import { StartAuthRequestDto } from '../dto/start-auth.request.dto';
import { BankIdOrderStoreService } from './bankid-order-store.service';
import { BankIdQrService } from './bankid-qr.service';
import { BankIdRpApiClient } from './bankid-rp-api.client';

@Injectable()
export class BankIdService {
  private readonly logger = new Logger(BankIdService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly bankIdRpApiClient: BankIdRpApiClient,
    private readonly bankIdOrderStoreService: BankIdOrderStoreService,
    private readonly bankIdQrService: BankIdQrService,
    private readonly bankIdCompletionService: BankIdCompletionService,
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

  async startAuth(input: StartAuthRequestDto, endUserIp: string) {
    const correlationId = randomUUID();

    this.logger.log(
      JSON.stringify({
        event: 'auth_start_requested',
        correlationId,
        flow: input.flow,
      }),
    );

    const bankIdResponse = this.isBankIdEnabled()
      ? await this.startLiveAuth(correlationId, endUserIp)
      : this.startSimulatedAuth();

    const localOrder = this.createLocalOrder({
      flow: input.flow,
      correlationId,
      bankIdResponse,
    });

    this.bankIdOrderStoreService.save(localOrder);

    this.logger.log(
      JSON.stringify({
        event: 'auth_started',
        correlationId,
        orderId: localOrder.orderId,
        flow: localOrder.flow,
        state: localOrder.status,
        mode: this.isBankIdEnabled() ? 'live' : 'simulated',
      }),
    );

    return this.toStartAuthResponse(localOrder);
  }

  async getOrderStatus(orderId: string) {
    const order = this.bankIdOrderStoreService.get(orderId);

    if (!order) {
      throw new NotFoundException('BankID order not found.');
    }

    const refreshedOrder = await this.refreshOrderStatus(order);

    return this.toStatusResponse(refreshedOrder);
  }

  private isBankIdEnabled() {
    return this.configService.get<boolean>('BANKID_ENABLED', false);
  }

  private async startLiveAuth(correlationId: string, endUserIp: string) {
    try {
      return await this.bankIdRpApiClient.auth(
        { endUserIp },
        {
          correlationId,
          operation: 'auth',
        },
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown BankID auth error';

      this.logger.error(
        JSON.stringify({
          event: 'auth_start_failed',
          correlationId,
          reason: message,
        }),
      );

      throw new BadGatewayException(
        'Unable to start BankID authentication right now.',
      );
    }
  }

  private async refreshOrderStatus(order: BankIdLocalOrder) {
    if (order.status !== 'pending') {
      return order;
    }

    if (!this.shouldCollectNow(order)) {
      return order;
    }

    const collectResponse = this.isBankIdEnabled()
      ? await this.collectLiveStatus(order)
      : this.collectSimulatedStatus(order);

    const snapshot = mapCollectStatusToSnapshot(collectResponse);
    const now = new Date().toISOString();
    const updatedOrder = this.bankIdOrderStoreService.update(order.orderId, {
      status: snapshot.state,
      hintCode: snapshot.hintCode,
      message: snapshot.message,
      lastCollectedAt: now,
      completedAt: snapshot.state === 'complete' ? now : order.completedAt,
      cancelledAt: snapshot.state === 'cancelled' ? now : order.cancelledAt,
      completionData:
        snapshot.state === 'complete'
          ? this.bankIdCompletionService.normalizeCompletionData(
              collectResponse.completionData ?? null,
              order.bankIdOrderRef,
            )
          : order.completionData,
    });

    this.logger.log(
      JSON.stringify({
        event: this.getCollectEventName(snapshot.state),
        correlationId: order.correlationId,
        orderId: order.orderId,
        flow: order.flow,
        state: snapshot.state,
        hintCode: snapshot.hintCode,
      }),
    );

    return updatedOrder ?? order;
  }

  private shouldCollectNow(order: BankIdLocalOrder) {
    if (!order.lastCollectedAt) {
      return true;
    }

    const collectIntervalMs = this.configService.getOrThrow<number>(
      'BANKID_COLLECT_INTERVAL_MS',
    );

    return (
      Date.now() - new Date(order.lastCollectedAt).getTime() >= collectIntervalMs
    );
  }

  private async collectLiveStatus(order: BankIdLocalOrder) {
    try {
      return await this.bankIdRpApiClient.collect(
        { orderRef: order.bankIdOrderRef },
        {
          correlationId: order.correlationId,
          operation: 'collect',
          orderId: order.orderId,
        },
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown BankID collect error';

      this.logger.error(
        JSON.stringify({
          event: 'auth_collect_failed',
          correlationId: order.correlationId,
          orderId: order.orderId,
          reason: message,
        }),
      );

      throw new BadGatewayException(
        'Unable to refresh BankID authentication status right now.',
      );
    }
  }

  private collectSimulatedStatus(order: BankIdLocalOrder): BankIdCollectApiResponse {
    const elapsedSeconds = Math.floor(
      (Date.now() - new Date(order.startedAt).getTime()) / 1000,
    );

    if (elapsedSeconds < 2) {
      return {
        status: 'pending',
        hintCode: 'outstandingTransaction',
      };
    }

    if (elapsedSeconds < 5) {
      return {
        status: 'pending',
        hintCode: order.flow === 'same-device' ? 'started' : 'outstandingTransaction',
      };
    }

    if (elapsedSeconds < 8) {
      return {
        status: 'pending',
        hintCode: 'userSign',
      };
    }

    return {
      status: 'complete',
      completionData: this.createSimulatedCompletionData(order),
    };
  }

  private createSimulatedCompletionData(order: BankIdLocalOrder) {
    return {
      user: {
        personalNumber: '199001011234',
        name: 'Test User',
        givenName: 'Test',
        surname: 'User',
      },
      device: {
        ipAddress: '127.0.0.1',
      },
      bankId: {
        orderRef: order.bankIdOrderRef,
        completionData: {
          simulated: true,
          completedAt: new Date().toISOString(),
        },
      },
    };
  }

  private getCollectEventName(
    state: BankIdLocalOrder['status'],
  ): 'auth_collect_pending' | 'auth_completed' | 'auth_failed' | 'auth_cancelled' {
    switch (state) {
      case 'complete':
        return 'auth_completed';
      case 'failed':
        return 'auth_failed';
      case 'cancelled':
        return 'auth_cancelled';
      default:
        return 'auth_collect_pending';
    }
  }

  private startSimulatedAuth(): BankIdAuthApiResponse {
    return {
      orderRef: `mock-order-ref-${randomUUID()}`,
      autoStartToken: randomUUID(),
      qrStartToken: `mock-qr-start-token-${randomUUID()}`,
      qrStartSecret: `mock-qr-start-secret-${randomUUID()}`,
    };
  }

  private createLocalOrder(input: {
    flow: BankIdFlow;
    correlationId: string;
    bankIdResponse: BankIdAuthApiResponse;
  }): BankIdLocalOrder {
    const now = new Date().toISOString();
    const hintCode = 'outstandingTransaction';
    const message = mapHintCodeToUserMessage(hintCode);

    return {
      orderId: randomUUID(),
      correlationId: input.correlationId,
      bankIdOrderRef: input.bankIdResponse.orderRef,
      flow: input.flow,
      status: 'pending',
      hintCode,
      message,
      startedAt: now,
      autoStartToken: input.bankIdResponse.autoStartToken,
      qrStartToken: input.bankIdResponse.qrStartToken,
      qrStartSecret: input.bankIdResponse.qrStartSecret,
      completionData: null,
    };
  }

  private async toStartAuthResponse(order: BankIdLocalOrder) {
    const response = {
      orderId: order.orderId,
      flow: order.flow,
      status: {
        state: order.status,
        hintCode: order.hintCode,
        message: order.message,
      },
      completion: order.completionData,
    };

    if (order.flow === 'same-device' && order.autoStartToken) {
      return {
        ...response,
        launch: {
          autoStartToken: order.autoStartToken,
          bankIdUrl: buildBankIdLaunchUrl(
            order.autoStartToken,
            this.getOnboardingRedirectUrl(),
          ),
        },
      };
    }

    return {
      ...response,
      qr: await this.bankIdQrService.generateQrPayload(order),
    };
  }

  private async toStatusResponse(order: BankIdLocalOrder) {
    return {
      orderId: order.orderId,
      flow: order.flow,
      state: order.status,
      hintCode: order.hintCode,
      message: order.message,
      qr: await this.bankIdQrService.generateQrPayload(order),
      completion: order.completionData,
    };
  }

  private getOnboardingRedirectUrl() {
    return new URL(
      '/onboarding',
      this.configService.getOrThrow<string>('FRONTEND_BASE_URL'),
    ).toString();
  }
}
