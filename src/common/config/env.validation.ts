import { z } from 'zod';

const booleanValue = z
  .union([z.boolean(), z.string()])
  .transform((value) => {
    if (typeof value === 'boolean') {
      return value;
    }

    return value.toLowerCase() === 'true';
  });

const integerWithDefault = (fallback: number) =>
  z
    .union([z.number(), z.string(), z.undefined()])
    .transform((value) => {
      if (value === undefined || value === '') {
        return fallback;
      }

      return Number(value);
    })
    .pipe(z.number().int().positive());

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    PORT: integerWithDefault(3000),
    FRONTEND_BASE_URL: z.string().url().default('http://localhost:5173'),
    BANKID_ENABLED: booleanValue.default(false),
    BANKID_API_BASE_URL: z
      .string()
      .url()
      .default('https://appapi2.test.bankid.com'),
    BANKID_RP_API_PREFIX: z.string().min(1).default('/rp/v6.0'),
    BANKID_PFX_PATH: z.string().trim().optional(),
    BANKID_PFX_PASSPHRASE: z.string().trim().optional(),
    BANKID_CA_PATH: z.string().trim().optional(),
    BANKID_REQUEST_TIMEOUT_MS: integerWithDefault(10000),
    BANKID_COLLECT_INTERVAL_MS: integerWithDefault(2000),
    BANKID_QR_REFRESH_INTERVAL_MS: integerWithDefault(1000),
    BANKID_ORDER_TTL_SECONDS: integerWithDefault(300),
  })
  .superRefine((value, ctx) => {
    if (!value.BANKID_ENABLED) {
      return;
    }

    const requiredFields = [
      'BANKID_PFX_PATH',
      'BANKID_PFX_PASSPHRASE',
      'BANKID_CA_PATH',
    ] as const;

    for (const field of requiredFields) {
      if (!value[field]) {
        ctx.addIssue({
          code: 'custom',
          message: `${field} is required when BANKID_ENABLED=true.`,
          path: [field],
        });
      }
    }
  });

export function validateEnv(config: Record<string, unknown>) {
  return envSchema.parse(config);
}
