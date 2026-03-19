import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type {
  BankIdCompletion,
  BankIdHealth,
  BankIdStartResponse,
  BankIdStatusResponse,
} from '../lib/bankidTypes'
import { useBankIdCancel } from '../hooks/useBankIdCancel'
import { useBankIdFoundation } from '../hooks/useBankIdFoundation'
import { useBankIdStart } from '../hooks/useBankIdStart'
import { useBankIdStatus } from '../hooks/useBankIdStatus'
import { OnboardingRoute } from './OnboardingRoute'

vi.mock('../hooks/useBankIdFoundation', () => ({
  useBankIdFoundation: vi.fn(),
}))

vi.mock('../hooks/useBankIdStart', () => ({
  useBankIdStart: vi.fn(),
}))

vi.mock('../hooks/useBankIdStatus', () => ({
  useBankIdStatus: vi.fn(),
}))

vi.mock('../hooks/useBankIdCancel', () => ({
  useBankIdCancel: vi.fn(),
}))

const mockedUseBankIdFoundation = vi.mocked(useBankIdFoundation)
const mockedUseBankIdStart = vi.mocked(useBankIdStart)
const mockedUseBankIdStatus = vi.mocked(useBankIdStatus)
const mockedUseBankIdCancel = vi.mocked(useBankIdCancel)

const foundationHealth: BankIdHealth = {
  ready: true,
  mode: 'disabled',
  apiBaseUrl: 'https://appapi2.test.bankid.com',
  rpApiPrefix: '/rp/v6.0',
  frontendBaseUrl: 'http://localhost:5173',
  requestTimeoutMs: 10000,
  collectIntervalMs: 2000,
  qrRefreshIntervalMs: 1000,
  orderTtlSeconds: 300,
  mtls: {
    certificateLoaded: false,
    caLoaded: false,
  },
  orderStore: {
    activeOrders: 0,
  },
}

const sameDeviceOrder: BankIdStartResponse = {
  orderId: 'order-same-device',
  flow: 'same-device',
  status: {
    state: 'pending',
    hintCode: 'started',
    message: 'Open the BankID app.',
  },
  launch: {
    autoStartToken: 'auto-start-token',
    bankIdUrl: 'bankid:///?autostarttoken=auto-start-token&redirect=null',
  },
  completion: null,
}

const qrOrder: BankIdStartResponse = {
  orderId: 'order-qr',
  flow: 'qr',
  status: {
    state: 'pending',
    hintCode: 'outstandingTransaction',
    message: 'Awaiting QR scan.',
  },
  qr: {
    imageDataUrl: 'data:image/png;base64,qr',
    refreshIntervalMs: 1000,
    refreshAt: '2026-03-19T00:00:01.000Z',
  },
  completion: null,
}

const completion: BankIdCompletion = {
  user: {
    personalNumber: '199001011234',
    name: 'Test User',
    givenName: 'Test',
    surname: 'User',
  },
  device: {
    ipAddress: '127.0.0.1',
  },
  bankId: {
    orderRef: 'bankid-order-ref',
    completionData: {
      ocspResponse: 'ok',
    },
  },
}

function createStatusResponse(
  overrides: Partial<BankIdStatusResponse>,
): BankIdStatusResponse {
  return {
    orderId: overrides.orderId ?? sameDeviceOrder.orderId,
    flow: overrides.flow ?? sameDeviceOrder.flow,
    state: overrides.state ?? 'pending',
    hintCode: overrides.hintCode ?? 'started',
    message: overrides.message ?? 'Waiting for user action.',
    qr: overrides.qr,
    completion: overrides.completion ?? null,
  }
}

interface MockQueryResult<TData> {
  data?: TData
  isLoading?: boolean
  isError: boolean
  error?: Error | null
}

function arrangeRoute({
  startImplementation,
  statusImplementation,
  cancelImplementation,
}: {
  startImplementation?: (flow: 'same-device' | 'qr') => Promise<BankIdStartResponse>
  statusImplementation?: (
    orderId: string | null,
    enabled: boolean,
    intervalMs?: number,
  ) => MockQueryResult<BankIdStatusResponse>
  cancelImplementation?: (orderId: string) => Promise<BankIdStatusResponse>
} = {}) {
  mockedUseBankIdFoundation.mockReturnValue({
    data: foundationHealth,
    isLoading: false,
    isError: false,
    error: null,
  } as any)

  mockedUseBankIdStart.mockReturnValue({
    isPending: false,
    variables: undefined,
    mutateAsync:
      startImplementation ??
      vi.fn(async (flow: 'same-device' | 'qr') =>
        flow === 'same-device' ? sameDeviceOrder : qrOrder,
      ),
    reset: vi.fn(),
  } as any)

  mockedUseBankIdStatus.mockImplementation(
    (statusImplementation ??
      ((orderId: string | null) => ({
        data: orderId
          ? createStatusResponse({
              orderId,
              flow: orderId === qrOrder.orderId ? 'qr' : 'same-device',
            })
          : undefined,
        isError: false,
        error: null,
      }))) as any,
  )

  mockedUseBankIdCancel.mockReturnValue({
    isPending: false,
    mutateAsync:
      cancelImplementation ??
      vi.fn(async (orderId: string) =>
        createStatusResponse({
          orderId,
          state: 'cancelled',
          hintCode: 'userCancel',
          message: 'The BankID session was cancelled.',
        }),
      ),
  } as any)
}

describe('OnboardingRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the foundation state and both entry paths', () => {
    arrangeRoute()

    render(<OnboardingRoute />)

    expect(screen.getByText('Backend BankID module is wired')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Start on this device' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Start QR flow' })).toBeVisible()
  })

  it('starts a same-device order and shows the active launch panel', async () => {
    const startMutation = vi.fn(async () => sameDeviceOrder)
    arrangeRoute({
      startImplementation: startMutation,
      statusImplementation: (orderId) =>
        ({
          data: orderId
            ? createStatusResponse({
                orderId,
                flow: 'same-device',
              })
            : undefined,
          isError: false,
          error: null,
        }),
    })

    render(<OnboardingRoute />)
    fireEvent.click(screen.getByRole('button', { name: 'Start on this device' }))

    await screen.findByText('Same-device flow started')

    expect(startMutation).toHaveBeenCalledWith('same-device')
    expect(screen.getByRole('link', { name: 'Open BankID' })).toHaveAttribute(
      'href',
      sameDeviceOrder.launch?.bankIdUrl,
    )
  })

  it('shows the completion result when the active order reaches success', async () => {
    arrangeRoute({
      startImplementation: vi.fn(async () => sameDeviceOrder),
      statusImplementation: (orderId) =>
        ({
          data: orderId
            ? createStatusResponse({
                orderId,
                flow: 'same-device',
                state: 'complete',
                hintCode: null,
                message: 'Authentication completed.',
                completion,
              })
            : undefined,
          isError: false,
          error: null,
        }),
    })

    render(<OnboardingRoute />)
    fireEvent.click(screen.getByRole('button', { name: 'Start on this device' }))

    await screen.findByText('BankID authentication succeeded')

    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.getByText('bankid-order-ref')).toBeInTheDocument()
  })

  it('offers QR fallback after a same-device failure and starts a QR retry', async () => {
    const startMutation = vi
      .fn<(flow: 'same-device' | 'qr') => Promise<BankIdStartResponse>>()
      .mockImplementation(async (flow) =>
        flow === 'same-device' ? sameDeviceOrder : qrOrder,
      )

    arrangeRoute({
      startImplementation: startMutation,
      statusImplementation: (orderId) =>
        ({
          data: orderId
            ? createStatusResponse({
                orderId,
                flow: orderId === qrOrder.orderId ? 'qr' : 'same-device',
                state: orderId === qrOrder.orderId ? 'pending' : 'failed',
                hintCode:
                  orderId === qrOrder.orderId ? 'outstandingTransaction' : 'expiredTransaction',
                message:
                  orderId === qrOrder.orderId
                    ? 'Waiting for QR scan.'
                    : 'The same-device session expired.',
                qr: orderId === qrOrder.orderId ? qrOrder.qr : undefined,
              })
            : undefined,
          isError: false,
          error: null,
        }),
    })

    render(<OnboardingRoute />)
    fireEvent.click(screen.getByRole('button', { name: 'Start on this device' }))

    await screen.findByText('BankID flow failed')
    fireEvent.click(screen.getByRole('button', { name: 'Retry with QR' }))

    await waitFor(() => {
      expect(startMutation).toHaveBeenNthCalledWith(1, 'same-device')
      expect(startMutation).toHaveBeenNthCalledWith(2, 'qr')
    })

    expect(screen.getByText('QR flow started')).toBeInTheDocument()
  })

  it('cancels a pending order and switches into the cancelled state panel', async () => {
    let statusState: BankIdStatusResponse['state'] = 'pending'
    const cancelMutation = vi.fn(async (orderId: string) => {
      statusState = 'cancelled'

      return createStatusResponse({
        orderId,
        state: 'cancelled',
        hintCode: 'userCancel',
        message: 'The BankID session was cancelled.',
      })
    })

    arrangeRoute({
      startImplementation: vi.fn(async () => qrOrder),
      statusImplementation: (orderId) =>
        ({
          data: orderId
            ? createStatusResponse({
                orderId,
                flow: 'qr',
                state: statusState,
                hintCode:
                  statusState === 'cancelled' ? 'userCancel' : 'outstandingTransaction',
                message:
                  statusState === 'cancelled'
                    ? 'The BankID session was cancelled.'
                    : 'Waiting for user action.',
                qr: qrOrder.qr,
              })
            : undefined,
          isError: false,
          error: null,
        }),
      cancelImplementation: cancelMutation,
    })

    render(<OnboardingRoute />)
    fireEvent.click(screen.getByRole('button', { name: 'Start QR flow' }))

    await screen.findByText('QR flow started')
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    await waitFor(() => {
      expect(cancelMutation).toHaveBeenCalledWith(qrOrder.orderId)
    })

    expect(screen.getByText('BankID flow cancelled')).toBeInTheDocument()
    expect(screen.getByText('The BankID session was cancelled.')).toBeInTheDocument()
  })
})
