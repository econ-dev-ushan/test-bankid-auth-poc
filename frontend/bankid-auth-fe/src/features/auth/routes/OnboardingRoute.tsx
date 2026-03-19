import { BankIdFoundationStatus } from '../components/BankIdFoundationStatus'
import { BankIdStageCard } from '../components/BankIdStageCard'

const nextStages = [
  {
    stage: 'Stage 2',
    title: 'Start auth flow',
    description:
      'Same-device and QR start actions will call the backend auth endpoint and return normalized launch data.',
  },
  {
    stage: 'Stage 3',
    title: 'Animated QR support',
    description:
      'The backend will own QR secret handling and the frontend will render refreshed QR frames only.',
  },
  {
    stage: 'Stage 4+',
    title: 'Polling, cancel, completion',
    description:
      'Order lifecycle, fallback handling, and final authenticated payload rendering will build on this foundation.',
  },
]

export function OnboardingRoute() {
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
                Stage 1 establishes the contracts, configuration, and feature boundaries for
                same-device and QR-based authentication on <code>/onboarding</code>.
              </p>
            </div>
            <div className="rounded-[28px] border border-amber-200/18 bg-slate-950/32 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-200/75">
                What is live now
              </p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-200/84">
                <li>Dedicated backend BankID module and config validation</li>
                <li>Frontend React Query provider and typed API layer</li>
                <li>Safe health contract to verify the foundation end to end</li>
              </ul>
            </div>
          </div>
        </section>

        <BankIdFoundationStatus />

        <section className="grid gap-6 lg:grid-cols-3">
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
