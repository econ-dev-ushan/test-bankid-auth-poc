import type { BankIdStartResponse, BankIdStatusResponse } from '../lib/bankidTypes'
import { BankIdQrPanel } from './BankIdQrPanel'
import { BankIdStageCard } from './BankIdStageCard'

interface BankIdStatusPanelProps {
  order: BankIdStartResponse
  status?: BankIdStatusResponse
  onRestart: () => void
  onCancel?: () => void
  onUseQrFallback?: () => void
  cancelling?: boolean
}

export function BankIdStatusPanel({
  order,
  status,
  onRestart,
  onCancel,
  onUseQrFallback,
  cancelling = false,
}: BankIdStatusPanelProps) {
  const displayState = status?.state ?? order.status.state
  const displayHintCode = status?.hintCode ?? order.status.hintCode
  const displayMessage = status?.message ?? order.status.message
  const displayQr = status?.qr ?? order.qr

  return (
    <BankIdStageCard
      eyebrow="Active order"
      title={order.flow === 'same-device' ? 'Same-device flow started' : 'QR flow started'}
      description={displayMessage}
      footer={
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onRestart}
            className="rounded-full border border-white/16 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-white/28 hover:bg-white/6"
          >
            Start over
          </button>
          {displayState === 'pending' && onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              disabled={cancelling}
              className="rounded-full border border-rose-200/24 px-4 py-2 text-sm font-semibold text-rose-100 transition hover:border-rose-200/40 hover:bg-rose-400/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {cancelling ? 'Cancelling...' : 'Cancel'}
            </button>
          ) : null}
          {order.flow === 'same-device' && displayState !== 'complete' && onUseQrFallback ? (
            <button
              type="button"
              onClick={onUseQrFallback}
              className="rounded-full border border-amber-200/24 px-4 py-2 text-sm font-semibold text-amber-100 transition hover:border-amber-200/40 hover:bg-amber-300/10"
            >
              Use QR instead
            </button>
          ) : null}
        </div>
      }
    >
      <dl className="grid gap-4 text-sm text-slate-200/82 sm:grid-cols-2">
        <div>
          <dt className="text-slate-400">Order ID</dt>
          <dd className="break-all">{order.orderId}</dd>
        </div>
        <div>
          <dt className="text-slate-400">State</dt>
          <dd className="capitalize">{displayState}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Hint code</dt>
          <dd>{displayHintCode ?? 'None'}</dd>
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
          <p className="mt-4 text-xs leading-5 text-emerald-100/78">
            If the BankID app does not open or this device path fails, switch to the QR fallback.
          </p>
        </div>
      ) : null}

      {displayQr?.imageDataUrl ? (
        <BankIdQrPanel
          imageDataUrl={displayQr.imageDataUrl}
          refreshAt={displayQr.refreshAt}
        />
      ) : displayQr ? (
        <div className="mt-6 rounded-[24px] border border-white/10 bg-slate-950/28 p-5">
          <p className="text-sm leading-6 text-slate-200/84">
            The QR order is active, but the QR frame is still being prepared by the backend.
          </p>
          <p className="mt-3 text-xs uppercase tracking-[0.24em] text-amber-200/75">
            Refresh interval {displayQr.refreshIntervalMs} ms
          </p>
        </div>
      ) : null}
    </BankIdStageCard>
  )
}
