import { useQuery } from '@tanstack/react-query'

import { getBankIdHealth } from '../api/bankidApi'

export function useBankIdFoundation() {
  return useQuery({
    queryKey: ['bankid', 'foundation'],
    queryFn: ({ signal }) => getBankIdHealth(signal),
  })
}
