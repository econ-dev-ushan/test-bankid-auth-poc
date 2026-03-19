import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, readFileSync } from 'node:fs';
import { Agent, request as httpsRequest } from 'node:https';
import { z } from 'zod';
import type {
  BankIdAuthApiRequest,
  BankIdAuthApiResponse,
  BankIdClientDiagnostics,
  BankIdCollectApiRequest,
  BankIdCollectApiResponse,
  BankIdSystemCallContext,
} from '../types/bankid.types';

const bankIdAuthResponseSchema = z.object({
  orderRef: z.string().min(1),
  autoStartToken: z.string().min(1),
  qrStartToken: z.string().min(1),
  qrStartSecret: z.string().min(1),
});

const bankIdCollectResponseSchema = z.object({
  status: z.enum(['pending', 'complete', 'failed']),
  hintCode: z.string().nullable().optional(),
  completionData: z.unknown().optional(),
});

@Injectable()
export class BankIdRpApiClient implements OnModuleInit {
  private readonly logger = new Logger(BankIdRpApiClient.name);
  private agent: Agent | null = null;
  private certificateLoaded = false;
  private caLoaded = false;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    if (!this.isEnabled()) {
      return;
    }

    this.getAgent();
    this.logger.log('BankID RP API client initialized with mTLS configuration.');
  }

  getDiagnostics(): BankIdClientDiagnostics {
    return {
      enabled: this.isEnabled(),
      apiBaseUrl: this.configService.getOrThrow<string>('BANKID_API_BASE_URL'),
      rpApiPrefix: this.configService.getOrThrow<string>('BANKID_RP_API_PREFIX'),
      requestTimeoutMs: this.configService.getOrThrow<number>(
        'BANKID_REQUEST_TIMEOUT_MS',
      ),
      certificateLoaded: this.certificateLoaded,
      caLoaded: this.caLoaded,
    };
  }

  getAgent() {
    if (this.agent) {
      return this.agent;
    }

    const pfxBuffer = this.readRequiredFile('BANKID_PFX_PATH');
    const caBuffer = this.readRequiredFile('BANKID_CA_PATH');

    this.agent = new Agent({
      keepAlive: true,
      pfx: pfxBuffer,
      ca: caBuffer,
      passphrase: this.configService.getOrThrow<string>(
        'BANKID_PFX_PASSPHRASE',
      ),
    });

    this.certificateLoaded = true;
    this.caLoaded = true;

    return this.agent;
  }

  async auth(
    payload: BankIdAuthApiRequest,
    context: BankIdSystemCallContext,
  ): Promise<BankIdAuthApiResponse> {
    const response = await this.postJson('/auth', payload, context);
    return bankIdAuthResponseSchema.parse(response);
  }

  async collect(
    payload: BankIdCollectApiRequest,
    context: BankIdSystemCallContext,
  ): Promise<BankIdCollectApiResponse> {
    const response = await this.postJson('/collect', payload, context);
    return bankIdCollectResponseSchema.parse(response);
  }

  private isEnabled() {
    return this.configService.get<boolean>('BANKID_ENABLED', false);
  }

  private async postJson(
    path: string,
    payload: unknown,
    context: BankIdSystemCallContext,
  ) {
    const baseUrl = this.configService.getOrThrow<string>('BANKID_API_BASE_URL');
    const rpApiPrefix =
      this.configService.getOrThrow<string>('BANKID_RP_API_PREFIX');
    const requestTimeoutMs = this.configService.getOrThrow<number>(
      'BANKID_REQUEST_TIMEOUT_MS',
    );
    const targetUrl = new URL(`${rpApiPrefix}${path}`, baseUrl);
    const body = JSON.stringify(payload);
    const startedAt = Date.now();

    this.logger.log(
      JSON.stringify({
        event: 'bankid_request_outgoing',
        system: 'bankid',
        operation: context.operation,
        path,
        correlationId: context.correlationId,
        orderId: context.orderId ?? null,
      }),
    );

    return new Promise<unknown>((resolve, reject) => {
      const request = httpsRequest(
        targetUrl,
        {
          method: 'POST',
          agent: this.getAgent(),
          headers: {
            'content-type': 'application/json',
            'content-length': Buffer.byteLength(body),
          },
          timeout: requestTimeoutMs,
        },
        (response) => {
          const chunks: Buffer[] = [];

          response.on('data', (chunk) => {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          });

          response.on('end', () => {
            const responseBody = Buffer.concat(chunks).toString('utf8');
            const parsedBody = responseBody ? JSON.parse(responseBody) : {};

            if ((response.statusCode ?? 500) >= 400) {
              this.logger.error(
                JSON.stringify({
                  event: 'bankid_request_failed',
                  system: 'bankid',
                  operation: context.operation,
                  path,
                  correlationId: context.correlationId,
                  orderId: context.orderId ?? null,
                  statusCode: response.statusCode ?? 500,
                  durationMs: Date.now() - startedAt,
                }),
              );
              reject(
                new Error(
                  `BankID request failed with status ${response.statusCode ?? 500}.`,
                ),
              );
              return;
            }

            this.logger.log(
              JSON.stringify({
                event: 'bankid_request_completed',
                system: 'bankid',
                operation: context.operation,
                path,
                correlationId: context.correlationId,
                orderId: context.orderId ?? null,
                statusCode: response.statusCode ?? 200,
                durationMs: Date.now() - startedAt,
              }),
            );
            resolve(parsedBody);
          });
        },
      );

      request.on('timeout', () => {
        request.destroy(
          new Error(`BankID request timed out after ${requestTimeoutMs}ms.`),
        );
      });

      request.on('error', (error) => {
        const tlsHint = this.getTlsDiagnosticHint(error.message);

        this.logger.error(
          JSON.stringify({
            event: 'bankid_request_failed',
            system: 'bankid',
            operation: context.operation,
            path,
            correlationId: context.correlationId,
            orderId: context.orderId ?? null,
            reason: error.message,
            hint: tlsHint,
            durationMs: Date.now() - startedAt,
          }),
        );
        reject(error);
      });

      request.write(body);
      request.end();
    });
  }

  private readRequiredFile(envKey: 'BANKID_PFX_PATH' | 'BANKID_CA_PATH') {
    const filePath = this.configService.getOrThrow<string>(envKey);

    if (!existsSync(filePath)) {
      throw new Error(`${envKey} points to a missing file: ${filePath}`);
    }

    return readFileSync(filePath);
  }

  private getTlsDiagnosticHint(errorMessage: string) {
    const normalizedMessage = errorMessage.toLowerCase();

    if (normalizedMessage.includes('self-signed certificate in certificate chain')) {
      return 'Possible TLS interception/proxy on the network path or BANKID_CA_PATH does not match the BankID test server CA.';
    }

    if (normalizedMessage.includes('unsupported pkcs12 pfx data')) {
      return 'The configured PKCS#12 file is likely not compatible with this Node/OpenSSL runtime. Prefer the modern .p12 BankID test certificate.';
    }

    if (normalizedMessage.includes('mac verify failure')) {
      return 'The PKCS#12 certificate password is likely incorrect, or the certificate file does not match the configured passphrase.';
    }

    return undefined;
  }
}
