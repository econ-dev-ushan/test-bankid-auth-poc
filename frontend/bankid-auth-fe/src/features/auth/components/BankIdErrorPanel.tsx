import { BankIdStageCard } from './BankIdStageCard'

interface BankIdErrorPanelProps {
  message: string
  onDismiss: () => void
}

export function BankIdErrorPanel({ message, onDismiss }: BankIdErrorPanelProps) {
  return (
    <BankIdStageCard
      eyebrow="Start error"
      title="Could not start BankID"
      description="The onboarding page received an error while asking the backend to start auth."
      footer={
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-full border border-white/16 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-white/28 hover:bg-white/6"
        >
          Dismiss
        </button>
      }
    >
      <p className="text-sm leading-6 text-rose-100">{message}</p>
    </BankIdStageCard>
  )
}
