import type {
  BankIdCompletionData,
  BankIdFlow,
  BankIdLaunchPayload,
  BankIdQrPayload,
  BankIdStatusSnapshot,
} from '../types/bankid.types';

export class StartAuthResponseDto {
  orderId!: string;
  flow!: BankIdFlow;
  launch?: BankIdLaunchPayload;
  qr?: BankIdQrPayload;
  status!: BankIdStatusSnapshot;
  completion?: BankIdCompletionData | null;
}
