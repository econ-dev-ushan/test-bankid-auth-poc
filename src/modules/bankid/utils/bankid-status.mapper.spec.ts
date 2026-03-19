import { mapCollectStatusToSnapshot } from './bankid-status.mapper';

describe('mapCollectStatusToSnapshot', () => {
  it('maps failed user-cancelled collect responses to cancelled state', () => {
    const snapshot = mapCollectStatusToSnapshot({
      status: 'failed',
      hintCode: 'userCancel',
    });

    expect(snapshot.state).toBe('cancelled');
    expect(snapshot.message).toBe('The BankID authentication was cancelled.');
  });

  it('maps pending collect responses to user-facing messages', () => {
    const snapshot = mapCollectStatusToSnapshot({
      status: 'pending',
      hintCode: 'userSign',
    });

    expect(snapshot.state).toBe('pending');
    expect(snapshot.message).toBe('Confirm your identity in the BankID app.');
  });
});
