import { useState } from 'react'

import { BankIdEntryCard } from '../components/BankIdEntryCard'
import { BankIdErrorPanel } from '../components/BankIdErrorPanel'
import { BankIdFoundationStatus } from '../components/BankIdFoundationStatus'
import { BankIdStageCard } from '../components/BankIdStageCard'
import { BankIdStatusPanel } from '../components/BankIdStatusPanel'
import { useBankIdFoundation } from '../hooks/useBankIdFoundation'
import { useBankIdStart } from '../hooks/useBankIdStart'
import { useBankIdStatus } from '../hooks/useBankIdStatus'
import type { BankIdFlow, BankIdStartResponse } from '../lib/bankidTypes'

const nextStages = [
  {
    stage: 'Stage 4+',
    title: 'Polling, cancel, completion',
    description:
      'Order lifecycle, fallback handling, and final authenticated payload rendering will build on this foundation.',
  },
]

export function OnboardingRoute() {
  const foundationQuery = useBankIdFoundation()
  const startMutation = useBankIdStart()
  const [activeOrder, setActiveOrder] = useState<BankIdStartResponse | null>(null)
  const [startError, setStartError] = useState<string | null>(null)
  const qrStatusQuery = useBankIdStatus(
    activeOrder?.orderId ?? null,
    activeOrder?.flow === 'qr',
    activeOrder?.qr?.refreshIntervalMs ?? 1000,
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
                Phase 3 adds backend-owned animated QR support so another-device BankID
                authentication can update safely on <code>/onboarding</code>.
              </p>
            </div>
            <div className="rounded-[28px] border border-amber-200/18 bg-slate-950/32 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-200/75">
                What is live now
              </p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-200/84">
                <li>Dedicated backend auth-start endpoint and local order persistence</li>
                <li>Animated QR frames generated on the backend from BankID start artifacts</li>
                <li>Frontend QR polling that refreshes the displayed code without exposing secrets</li>
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

        {activeOrder ? (
          <BankIdStatusPanel
            order={activeOrder}
            status={qrStatusQuery.data}
            onRestart={resetStartState}
          />
        ) : null}

        {startError ? (
          <BankIdErrorPanel message={startError} onDismiss={resetStartState} />
        ) : null}

        <section className="grid gap-6 lg:grid-cols-2">
          {nextStages.map((item) => (
            <BankIdStageCard
              key={item.stage}
              eyebrow={item.stage}
              title={item.title}
              description={item.description}
            >
              <p className="text-sm leading-6 text-slate-300/78">
                This stage is intentionally held until you approve the next increment.
              </p>
            </BankIdStageCard>
          ))}
        </section>
      </div>
    </main>
  )
}
