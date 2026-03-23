import { useState } from 'react'

import { BankIdEntryCard } from '../components/BankIdEntryCard'
import { BankIdErrorPanel } from '../components/BankIdErrorPanel'
import { BankIdFoundationStatus } from '../components/BankIdFoundationStatus'
import { BankIdResultPanel } from '../components/BankIdResultPanel'
import { BankIdStatusPanel } from '../components/BankIdStatusPanel'
import { useBankIdCancel } from '../hooks/useBankIdCancel'
import { useBankIdFoundation } from '../hooks/useBankIdFoundation'
import { useBankIdStart } from '../hooks/useBankIdStart'
import { useBankIdStatus } from '../hooks/useBankIdStatus'
import type { BankIdFlow, BankIdStartResponse } from '../lib/bankidTypes'

export function OnboardingRoute() {
  const foundationQuery = useBankIdFoundation()
  const startMutation = useBankIdStart()
  const cancelMutation = useBankIdCancel()
  const [activeOrder, setActiveOrder] = useState<BankIdStartResponse | null>(null)
  const [startError, setStartError] = useState<string | null>(null)
  const statusQuery = useBankIdStatus(
    activeOrder?.orderId ?? null,
    !!activeOrder,
    activeOrder?.flow === 'qr'
      ? (activeOrder.qr?.refreshIntervalMs ?? 1000)
      : (foundationQuery.data?.collectIntervalMs ?? 2000),
  )

  async function handleStart(flow: BankIdFlow) {
    setStartError(null)
    setActiveOrder(null)

    try {
      const response = await startMutation.mutateAsync(flow)
      setActiveOrder(response)
    } catch (error) {
      setStartError(
        error instanceof Error ? error.message : 'Unknown BankID start error',
      )
    }
  }

  async function handleCancel() {
    if (!activeOrder) {
      return
    }

    setStartError(null)

    try {
      const cancelledStatus = await cancelMutation.mutateAsync(activeOrder.orderId)
      setActiveOrder((current) =>
        current
          ? {
              ...current,
              status: {
                state: cancelledStatus.state,
                hintCode: cancelledStatus.hintCode,
                message: cancelledStatus.message,
              },
              completion: cancelledStatus.completion ?? current.completion,
            }
          : current,
      )
    } catch (error) {
      setStartError(
        error instanceof Error ? error.message : 'Could not cancel BankID order.',
      )
    }
  }

  async function handleUseQrFallback() {
    await handleStart('qr')
  }

  function resetStartState() {
    setActiveOrder(null)
    setStartError(null)
    startMutation.reset()
  }

  const isStartingSameDevice =
    startMutation.isPending && startMutation.variables === 'same-device'
  const isStartingQr = startMutation.isPending && startMutation.variables === 'qr'
  const startDisabled =
    foundationQuery.isLoading || foundationQuery.isError || startMutation.isPending
  const isCancelling = cancelMutation.isPending
  const completion = statusQuery.data?.completion ?? activeOrder?.completion ?? null
  const isComplete = (statusQuery.data?.state ?? activeOrder?.status.state) === 'complete'
  const isCancelled =
    (statusQuery.data?.state ?? activeOrder?.status.state) === 'cancelled'
  const isFailed = (statusQuery.data?.state ?? activeOrder?.status.state) === 'failed'

  return (
    <main className="min-h-screen px-5 py-10 sm:px-8 lg:px-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <section className="overflow-hidden rounded-[36px] border border-white/10 bg-[linear-gradient(140deg,rgba(255,255,255,0.1),rgba(255,255,255,0.03))] p-8 shadow-[0_30px_120px_rgba(0,0,0,0.32)] backdrop-blur sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.38em] text-amber-200/80">
            BankID onboarding
          </p>
          <div className="mt-6 grid gap-8 lg:grid-cols-[1.3fr_0.9fr]">
            <div>
              <h1 className="max-w-3xl text-4xl leading-tight text-white sm:text-5xl">
                Building the backend-owned BankID flow one safe stage at a time.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-200/82">
                Phase 8 hardens the backend lifecycle with TTL-based order retention,
                predictable expired-order cleanup, and explicit HTTP exception mapping.
              </p>
            </div>
            <div className="rounded-[28px] border border-amber-200/18 bg-slate-950/32 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-200/75">
                What is live now
              </p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-200/84">
                <li>In-memory orders now expire predictably using the configured backend TTL</li>
                <li>Expired orders are pruned cleanly and return a stable 404 response contract</li>
                <li>HTTP exception handling is explicit, structured, and consistent across test and app runs</li>
              </ul>
            </div>
          </div>
        </section>

        <BankIdFoundationStatus />

        <section className="grid gap-6 lg:grid-cols-2">
          <BankIdEntryCard
            title="Continue on this device"
            description="Start an auth order and receive a BankID deep link that can launch the app on the current device."
            flow="same-device"
            actionLabel="Start on this device"
            disabled={startDisabled}
            pending={isStartingSameDevice}
            onStart={handleStart}
          />
          <BankIdEntryCard
            title="Use another device"
            description="Start a QR-based auth order and render the animated BankID QR code from backend responses."
            flow="qr"
            actionLabel="Start QR flow"
            disabled={startDisabled}
            pending={isStartingQr}
            onStart={handleStart}
          />
        </section>

        {activeOrder && isComplete && completion ? (
          <BankIdResultPanel
            orderId={activeOrder.orderId}
            flow={activeOrder.flow}
            completion={completion}
            onRestart={resetStartState}
          />
        ) : null}

        {activeOrder && !isComplete && !isCancelled && !isFailed ? (
          <BankIdStatusPanel
            order={activeOrder}
            status={statusQuery.data}
            onRestart={resetStartState}
            onCancel={handleCancel}
            onUseQrFallback={handleUseQrFallback}
            cancelling={isCancelling}
          />
        ) : null}

        {activeOrder && (isCancelled || isFailed) ? (
          <BankIdErrorPanel
            title={isCancelled ? 'BankID flow cancelled' : 'BankID flow failed'}
            description={
              isCancelled
                ? 'The current BankID session is no longer active.'
                : 'The BankID session reached a terminal failure state.'
            }
            message={statusQuery.data?.message ?? activeOrder.status.message}
            onDismiss={resetStartState}
            secondaryAction={
              activeOrder.flow === 'same-device' ? (
                <button
                  type="button"
                  onClick={handleUseQrFallback}
                  className="rounded-full border border-amber-200/24 px-4 py-2 text-sm font-semibold text-amber-100 transition hover:border-amber-200/40 hover:bg-amber-300/10"
                >
                  Retry with QR
                </button>
              ) : undefined
            }
          />
        ) : null}

        {statusQuery.isError ? (
          <BankIdErrorPanel
            message={
              statusQuery.error instanceof Error
                ? statusQuery.error.message
                : 'Could not refresh BankID order status.'
            }
            onDismiss={resetStartState}
          />
        ) : null}

        {startError ? (
          <BankIdErrorPanel message={startError} onDismiss={resetStartState} />
        ) : null}
      </div>
    </main>
  )
}
