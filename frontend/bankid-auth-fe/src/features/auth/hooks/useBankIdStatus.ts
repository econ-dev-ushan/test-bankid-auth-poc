import { useQuery } from '@tanstack/react-query'

import { getBankIdOrderStatus } from '../api/bankidApi'

export function useBankIdStatus(
  orderId: string | null,
  enabled: boolean,
  intervalMs = 2000,
) {
  return useQuery({
    queryKey: ['bankid', 'orders', orderId],
    queryFn: ({ signal }) => getBankIdOrderStatus(orderId!, signal),
    enabled: enabled && !!orderId,
    refetchInterval: (query) =>
      query.state.data?.state === 'pending' ? intervalMs : false,
  })
}
