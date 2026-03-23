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
  failedAt?: string;
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

export interface BankIdAuthApiRequest {
  endUserIp: string;
}

export interface BankIdAuthApiResponse {
  orderRef: string;
  autoStartToken: string;
  qrStartToken: string;
  qrStartSecret: string;
}

export interface BankIdCollectApiRequest {
  orderRef: string;
}

export interface BankIdCollectApiResponse {
  status: 'pending' | 'complete' | 'failed';
  hintCode?: string | null;
  completionData?: unknown;
}

export interface BankIdCancelApiRequest {
  orderRef: string;
}

export interface BankIdSystemCallContext {
  correlationId: string;
  operation: 'auth' | 'collect' | 'cancel';
  orderId?: string;
}
