import type {
  BankIdCompletionData,
  BankIdFlow,
  BankIdQrPayload,
  BankIdOrderState,
} from '../types/bankid.types';

export class StatusResponseDto {
  orderId!: string;
  flow!: BankIdFlow;
  state!: BankIdOrderState;
  hintCode!: string | null;
  message!: string;
  qr?: BankIdQrPayload;
  completion?: BankIdCompletionData | null;
}
