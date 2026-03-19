import type { BankIdStartResponse } from '../lib/bankidTypes'
import { BankIdStageCard } from './BankIdStageCard'

interface BankIdStatusPanelProps {
  order: BankIdStartResponse
  onRestart: () => void
}

export function BankIdStatusPanel({ order, onRestart }: BankIdStatusPanelProps) {
  return (
    <BankIdStageCard
      eyebrow="Active order"
      title={order.flow === 'same-device' ? 'Same-device flow started' : 'QR flow started'}
      description={order.status.message}
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
      <dl className="grid gap-4 text-sm text-slate-200/82 sm:grid-cols-2">
        <div>
          <dt className="text-slate-400">Order ID</dt>
          <dd className="break-all">{order.orderId}</dd>
        </div>
        <div>
          <dt className="text-slate-400">State</dt>
          <dd className="capitalize">{order.status.state}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Hint code</dt>
          <dd>{order.status.hintCode ?? 'None'}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Flow</dt>
          <dd>{order.flow}</dd>
        </div>
      </dl>

      {order.launch ? (
        <div className="mt-6 rounded-[24px] border border-emerald-300/18 bg-emerald-400/8 p-5">
          <p className="text-sm leading-6 text-emerald-50">
            Your BankID launch URL is ready. Use the button below to open the app on this device.
          </p>
          <a
            href={order.launch.bankIdUrl}
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-emerald-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-200"
          >
            Open BankID
          </a>
        </div>
      ) : null}

      {order.qr ? (
        <div className="mt-6 rounded-[24px] border border-white/10 bg-slate-950/28 p-5">
          <p className="text-sm leading-6 text-slate-200/84">
            The QR order is active and ready. Animated QR rendering lands in Phase 3, but the
            backend is already returning the local order id and QR refresh cadence.
          </p>
          <p className="mt-3 text-xs uppercase tracking-[0.24em] text-amber-200/75">
            Refresh interval {order.qr.refreshIntervalMs} ms
          </p>
        </div>
      ) : null}
    </BankIdStageCard>
  )
}
