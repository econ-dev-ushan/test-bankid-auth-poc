import { validateEnv } from './env.validation';

describe('validateEnv', () => {
  it('allows BankID to stay disabled without certificate material', () => {
    const env = validateEnv({
      PORT: '3000',
      FRONTEND_BASE_URL: 'http://localhost:5173',
    });

    expect(env.BANKID_ENABLED).toBe(false);
    expect(env.BANKID_API_BASE_URL).toBe('https://appapi2.test.bankid.com');
  });

  it('requires certificate settings when BankID is enabled', () => {
    expect(() =>
      validateEnv({
        PORT: '3000',
        FRONTEND_BASE_URL: 'http://localhost:5173',
        BANKID_ENABLED: 'true',
      }),
    ).toThrow(/BANKID_PFX_PATH is required/);
  });
});
