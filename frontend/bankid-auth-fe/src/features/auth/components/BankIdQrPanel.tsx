interface BankIdQrPanelProps {
  imageDataUrl: string
  refreshAt?: string
}

export function BankIdQrPanel({ imageDataUrl, refreshAt }: BankIdQrPanelProps) {
  return (
    <div className="mt-6 rounded-[24px] border border-amber-200/18 bg-white/6 p-5">
      <p className="text-sm leading-6 text-slate-100">
        Open BankID on your other device and scan this animated QR code.
      </p>
      <div className="mt-5 inline-flex rounded-[24px] bg-white p-4 shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
        <img
          src={imageDataUrl}
          alt="Animated BankID QR code"
          className="h-64 w-64 rounded-[16px]"
        />
      </div>
      {refreshAt ? (
        <p className="mt-4 text-xs uppercase tracking-[0.24em] text-amber-200/75">
          Refreshing until {new Date(refreshAt).toLocaleTimeString()}
        </p>
      ) : null}
    </div>
  )
}
