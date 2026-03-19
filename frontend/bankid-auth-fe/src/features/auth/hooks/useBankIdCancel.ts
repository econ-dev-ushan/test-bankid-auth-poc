import { useMutation } from '@tanstack/react-query'

import { cancelBankIdOrder } from '../api/bankidApi'

export function useBankIdCancel() {
  return useMutation({
    mutationFn: cancelBankIdOrder,
  })
}
