import type {
  BankIdOrderState,
  BankIdStatusSnapshot,
} from '../types/bankid.types';
import { mapHintCodeToUserMessage } from './bankid-user-message.mapper';

interface CollectStatusInput {
  status: 'pending' | 'complete' | 'failed';
  hintCode?: string | null;
}

function mapState(status: CollectStatusInput['status']): BankIdOrderState {
  switch (status) {
    case 'complete':
      return 'complete';
    case 'failed':
      return 'failed';
    default:
      return 'pending';
  }
}

export function mapCollectStatusToSnapshot(
  input: CollectStatusInput,
): BankIdStatusSnapshot {
  const hintCode = input.hintCode ?? null;
  const state = mapState(input.status);

  return {
    state,
    hintCode,
    message:
      state === 'complete'
        ? 'Authentication completed.'
        : mapHintCodeToUserMessage(hintCode),
  };
}
