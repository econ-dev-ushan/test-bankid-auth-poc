import { BankIdCompletionService } from './bankid-completion.service';

describe('BankIdCompletionService', () => {
  const service = new BankIdCompletionService();

  it('normalizes raw BankID completion data into the frontend-safe result shape', () => {
    const completion = service.normalizeCompletionData(
      {
        user: {
          personalNumber: '199001011234',
          name: 'Test User',
          givenName: 'Test',
          surname: 'User',
        },
        device: {
          ipAddress: '203.0.113.10',
        },
        cert: {
          notBefore: '2026-01-01',
        },
      },
      'bankid-order-ref-123',
    );

    expect(completion).toEqual({
      user: {
        personalNumber: '199001011234',
        name: 'Test User',
        givenName: 'Test',
        surname: 'User',
      },
      device: {
        ipAddress: '203.0.113.10',
      },
      bankId: {
        orderRef: 'bankid-order-ref-123',
        completionData: {
          user: {
            personalNumber: '199001011234',
            name: 'Test User',
            givenName: 'Test',
            surname: 'User',
          },
          device: {
            ipAddress: '203.0.113.10',
          },
          cert: {
            notBefore: '2026-01-01',
          },
        },
      },
    });
  });
});
