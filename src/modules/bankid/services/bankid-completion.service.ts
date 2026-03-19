import { Injectable } from '@nestjs/common';
import type { BankIdCompletionData } from '../types/bankid.types';

@Injectable()
export class BankIdCompletionService {
  normalizeCompletionData(raw: unknown): BankIdCompletionData | null {
    if (!raw || typeof raw !== 'object') {
      return null;
    }

    return raw as BankIdCompletionData;
  }
}
