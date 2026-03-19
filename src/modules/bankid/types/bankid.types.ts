export const BANKID_FLOWS = ['same-device', 'qr'] as const;
export const BANKID_ORDER_STATES = [
  'pending',
  'complete',
  'failed',
  'cancelled',
] as const;

export type BankIdFlow = (typeof BANKID_FLOWS)[number];
export type BankIdOrderState = (typeof BANKID_ORDER_STATES)[number];

export interface BankIdStatusSnapshot {
  state: BankIdOrderState;
  hintCode: string | null;
  message: string;
}

export interface BankIdLaunchPayload {
  autoStartToken: string;
  bankIdUrl: string;
}

export interface BankIdQrPayload {
  imageDataUrl: string | null;
  refreshIntervalMs: number;
  refreshAt?: string;
}

export interface BankIdCompletionData {
  user: {
    personalNumber: string;
    name: string;
    givenName: string;
    surname: string;
  };
  device: {
    ipAddress: string;
  };
  bankId: {
    orderRef: string;
    completionData: unknown;
  };
}

export interface BankIdLocalOrder {
  orderId: string;
  correlationId: string;
  bankIdOrderRef: string;
  flow: BankIdFlow;
  status: BankIdOrderState;
  hintCode: string | null;
  message: string;
  startedAt: string;
  lastCollectedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  autoStartToken?: string;
  qrStartToken?: string;
  qrStartSecret?: string;
  completionData?: BankIdCompletionData | null;
}

export interface BankIdClientDiagnostics {
  enabled: boolean;
  apiBaseUrl: string;
  rpApiPrefix: string;
  requestTimeoutMs: number;
  certificateLoaded: boolean;
  caLoaded: boolean;
}
