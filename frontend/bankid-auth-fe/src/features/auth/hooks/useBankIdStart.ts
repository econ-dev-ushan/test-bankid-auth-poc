import { useMutation } from '@tanstack/react-query'

import { startBankIdAuth } from '../api/bankidApi'

export function useBankIdStart() {
  return useMutation({
    mutationFn: startBankIdAuth,
  })
}
