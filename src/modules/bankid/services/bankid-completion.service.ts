import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import type { BankIdCompletionData } from '../types/bankid.types';

const bankIdNormalizedCompletionSchema = z.object({
  user: z.object({
    personalNumber: z.string(),
    name: z.string(),
    givenName: z.string(),
    surname: z.string(),
  }),
  device: z.object({
    ipAddress: z.string(),
  }),
  bankId: z.object({
    orderRef: z.string(),
    completionData: z.unknown(),
  }),
});

const bankIdRawCompletionSchema = z
  .object({
    user: z.object({
      personalNumber: z.string(),
      name: z.string(),
      givenName: z.string(),
      surname: z.string(),
    }),
    device: z
      .object({
        ipAddress: z.string().optional(),
      })
      .loose(),
  })
  .loose();

@Injectable()
export class BankIdCompletionService {
  normalizeCompletionData(
    raw: unknown,
    orderRef: string,
  ): BankIdCompletionData | null {
    const normalizedResult = bankIdNormalizedCompletionSchema.safeParse(raw);

    if (normalizedResult.success) {
      return normalizedResult.data;
    }

    const parsedResult = bankIdRawCompletionSchema.safeParse(raw);

    if (!parsedResult.success) {
      return null;
    }

    return {
      user: parsedResult.data.user,
      device: {
        ipAddress: parsedResult.data.device.ipAddress ?? 'unknown',
      },
      bankId: {
        orderRef,
        completionData: raw,
      },
    };
  }
}
