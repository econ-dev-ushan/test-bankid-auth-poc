import type { BankIdFlow } from '../lib/bankidTypes'
import { BankIdStageCard } from './BankIdStageCard'

interface BankIdEntryCardProps {
  title: string
  description: string
  flow: BankIdFlow
  actionLabel: string
  disabled?: boolean
  pending?: boolean
  onStart: (flow: BankIdFlow) => void
}

export function BankIdEntryCard({
  title,
  description,
  flow,
  actionLabel,
  disabled = false,
  pending = false,
  onStart,
}: BankIdEntryCardProps) {
  return (
    <BankIdStageCard
      eyebrow={flow === 'same-device' ? 'Same device' : 'Another device'}
      title={title}
      description={description}
    >
      <button
        type="button"
        onClick={() => onStart(flow)}
        disabled={disabled}
        className="inline-flex min-h-12 items-center justify-center rounded-full bg-amber-200 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:bg-white/12 disabled:text-slate-400"
      >
        {pending ? 'Starting...' : actionLabel}
      </button>
    </BankIdStageCard>
  )
}
