import { BankIdStageCard } from './BankIdStageCard'

interface BankIdErrorPanelProps {
  title?: string
  description?: string
  message: string
  onDismiss: () => void
  secondaryAction?: React.ReactNode
}

export function BankIdErrorPanel({
  title = 'Could not start BankID',
  description = 'The onboarding page received an error while asking the backend to start auth.',
  message,
  onDismiss,
  secondaryAction,
}: BankIdErrorPanelProps) {
  return (
    <BankIdStageCard
      eyebrow="Start error"
      title={title}
      description={description}
      footer={
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-full border border-white/16 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-white/28 hover:bg-white/6"
          >
            Dismiss
          </button>
          {secondaryAction}
        </div>
      }
    >
      <p className="text-sm leading-6 text-rose-100">{message}</p>
    </BankIdStageCard>
  )
}
