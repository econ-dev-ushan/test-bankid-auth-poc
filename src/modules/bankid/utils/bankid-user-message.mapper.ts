export function mapHintCodeToUserMessage(hintCode: string | null | undefined) {
  switch (hintCode) {
    case 'outstandingTransaction':
      return 'Open your BankID app to continue.';
    case 'noClient':
      return 'BankID app could not be found on this device.';
    case 'started':
      return 'BankID is starting.';
    case 'userSign':
      return 'Confirm your identity in the BankID app.';
    case 'userMrtd':
      return 'Scan your passport or national ID with BankID.';
    case 'expiredTransaction':
      return 'This BankID session has expired. Please restart the flow.';
    case 'certificateErr':
      return 'BankID test credentials need attention before this flow can run.';
    default:
      return 'Preparing your BankID session.';
  }
}
