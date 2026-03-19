import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, readFileSync } from 'node:fs';
import { Agent } from 'node:https';
import type { BankIdClientDiagnostics } from '../types/bankid.types';

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

  private isEnabled() {
    return this.configService.get<boolean>('BANKID_ENABLED', false);
  }

  private readRequiredFile(envKey: 'BANKID_PFX_PATH' | 'BANKID_CA_PATH') {
    const filePath = this.configService.getOrThrow<string>(envKey);

    if (!existsSync(filePath)) {
      throw new Error(`${envKey} points to a missing file: ${filePath}`);
    }

    return readFileSync(filePath);
  }
}
