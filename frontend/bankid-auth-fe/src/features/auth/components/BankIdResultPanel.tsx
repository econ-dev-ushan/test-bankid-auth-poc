import type { BankIdCompletion, BankIdFlow } from '../lib/bankidTypes'
import { BankIdStageCard } from './BankIdStageCard'

interface BankIdResultPanelProps {
  orderId: string
  flow: BankIdFlow
  completion: BankIdCompletion
  onRestart: () => void
}

export function BankIdResultPanel({
  orderId,
  flow,
  completion,
  onRestart,
}: BankIdResultPanelProps) {
  return (
    <BankIdStageCard
      eyebrow="Authentication complete"
      title="BankID authentication succeeded"
      description="This is the normalized completion payload returned by the backend after the BankID flow reached a terminal success state."
      footer={
        <button
          type="button"
          onClick={onRestart}
          className="rounded-full border border-white/16 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-white/28 hover:bg-white/6"
        >
          Start over
        </button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-[24px] border border-emerald-300/18 bg-emerald-400/8 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-100/80">
            Identity
          </p>
          <dl className="mt-4 grid gap-3 text-sm text-emerald-50">
            <div>
              <dt className="text-emerald-200/70">Name</dt>
              <dd>{completion.user.name}</dd>
            </div>
            <div>
              <dt className="text-emerald-200/70">Personal number</dt>
              <dd>{completion.user.personalNumber}</dd>
            </div>
            <div>
              <dt className="text-emerald-200/70">Given name</dt>
              <dd>{completion.user.givenName}</dd>
            </div>
            <div>
              <dt className="text-emerald-200/70">Surname</dt>
              <dd>{completion.user.surname}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-[24px] border border-white/10 bg-slate-950/28 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-200/80">
            Session
          </p>
          <dl className="mt-4 grid gap-3 text-sm text-slate-100/88">
            <div>
              <dt className="text-slate-400">Order ID</dt>
              <dd className="break-all">{orderId}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Flow</dt>
              <dd>{flow}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Device IP</dt>
              <dd>{completion.device.ipAddress}</dd>
            </div>
            <div>
              <dt className="text-slate-400">BankID orderRef</dt>
              <dd className="break-all">{completion.bankId.orderRef}</dd>
            </div>
          </dl>
        </section>
      </div>

      <section className="mt-6 rounded-[24px] border border-white/10 bg-slate-950/36 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-200/80">
          Raw completion data
        </p>
        <pre className="mt-4 overflow-x-auto rounded-[18px] bg-slate-950/70 p-4 text-xs leading-6 text-slate-100/86">
          {JSON.stringify(completion.bankId.completionData, null, 2)}
        </pre>
      </section>
    </BankIdStageCard>
  )
}
