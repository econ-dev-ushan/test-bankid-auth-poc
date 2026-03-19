export function buildBankIdLaunchUrl(
  autoStartToken: string,
  redirectUrl: string,
) {
  const params = new URLSearchParams({
    autostarttoken: autoStartToken,
    redirect: redirectUrl,
  });

  return `bankid:///?${params.toString()}`;
}
