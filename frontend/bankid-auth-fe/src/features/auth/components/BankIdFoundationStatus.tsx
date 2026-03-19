import { useBankIdFoundation } from '../hooks/useBankIdFoundation'
import { BankIdStageCard } from './BankIdStageCard'

function StatusPill({ label, tone }: { label: string; tone: 'ok' | 'warn' | 'idle' }) {
  const tones = {
    ok: 'bg-emerald-400/18 text-emerald-100 ring-emerald-300/30',
    warn: 'bg-amber-400/18 text-amber-100 ring-amber-200/30',
    idle: 'bg-white/10 text-slate-100 ring-white/12',
  }

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${tones[tone]}`}>
      {label}
    </span>
  )
}

export function BankIdFoundationStatus() {
  const foundationQuery = useBankIdFoundation()

  if (foundationQuery.isLoading) {
    return (
      <BankIdStageCard
        eyebrow="Foundation"
        title="Checking backend readiness"
        description="The onboarding feature is asking the Nest backend for BankID foundation status."
      >
        <StatusPill label="Loading" tone="idle" />
      </BankIdStageCard>
    )
  }

  if (foundationQuery.isError) {
    return (
      <BankIdStageCard
        eyebrow="Foundation"
        title="Backend not reachable yet"
        description="Stage 1 is wired to expect a BankID health endpoint. Start the Nest app to verify the contract end to end."
        footer={
          <p className="text-xs leading-5 text-slate-300/78">
            {foundationQuery.error instanceof Error
              ? foundationQuery.error.message
              : 'Unknown foundation error'}
          </p>
        }
      >
        <StatusPill label="Unavailable" tone="warn" />
      </BankIdStageCard>
    )
  }

  const health = foundationQuery.data

  if (!health) {
    return null
  }

  return (
    <BankIdStageCard
      eyebrow="Foundation"
      title="Backend BankID module is wired"
      description="This confirms the frontend is talking to the dedicated BankID module and receiving the normalized Stage 1 diagnostics contract."
      footer={
        <dl className="grid gap-3 text-sm text-slate-200/82 sm:grid-cols-2">
          <div>
            <dt className="text-slate-400">API base</dt>
            <dd>{health.apiBaseUrl}</dd>
          </div>
          <div>
            <dt className="text-slate-400">RP prefix</dt>
            <dd>{health.rpApiPrefix}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Collect interval</dt>
            <dd>{health.collectIntervalMs} ms</dd>
          </div>
          <div>
            <dt className="text-slate-400">QR interval</dt>
            <dd>{health.qrRefreshIntervalMs} ms</dd>
          </div>
        </dl>
      }
    >
      <div className="flex flex-wrap gap-3">
        <StatusPill label={health.ready ? 'Ready for Stage 2' : 'Needs config'} tone={health.ready ? 'ok' : 'warn'} />
        <StatusPill
          label={
            health.mode === 'configured'
              ? 'Live BankID config enabled'
              : 'Safe scaffold mode'
          }
          tone={health.mode === 'configured' ? 'ok' : 'idle'}
        />
      </div>
    </BankIdStageCard>
  )
}
