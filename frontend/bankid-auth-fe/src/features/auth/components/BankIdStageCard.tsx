import type { PropsWithChildren, ReactNode } from 'react'

interface BankIdStageCardProps extends PropsWithChildren {
  eyebrow: string
  title: string
  description: string
  footer?: ReactNode
}

export function BankIdStageCard({
  eyebrow,
  title,
  description,
  footer,
  children,
}: BankIdStageCardProps) {
  return (
    <article className="rounded-[28px] border border-white/12 bg-white/6 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-200/75">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-2xl text-white">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-200/82">{description}</p>
      <div className="mt-6">{children}</div>
      {footer ? <div className="mt-6 border-t border-white/10 pt-4">{footer}</div> : null}
    </article>
  )
}
