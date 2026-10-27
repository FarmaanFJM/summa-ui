import { useId, type ReactNode } from 'react'

/** Section band with a max-width content column. */
export function Band({ id, tone = 'a', children, className = '' }: { id?: string; tone?: 'a' | 'b'; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={`cc-band ${tone} ${className}`} data-section={id}>
      <div className="cc-wrap">{children}</div>
    </section>
  )
}

export function BandHead({ title, children, sub }: { title: string; sub?: string; children?: ReactNode }) {
  return (
    <header className="cc-bandhead">
      <div>
        <h2 className="cc-h2">{title}</h2>
        {sub && <p className="muted cc-sub">{sub}</p>}
      </div>
      {children && <div className="cc-bandhead-ctl">{children}</div>}
    </header>
  )
}

export function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: (p: { id: string; 'aria-invalid': boolean; 'aria-describedby'?: string }) => ReactNode }) {
  const id = useId()
  const msg = error || hint
  return (
    <div className="cc-field">
      <label htmlFor={id} className="cc-label">{label}</label>
      {children({ id, 'aria-invalid': !!error, 'aria-describedby': msg ? id + '-m' : undefined })}
      {msg && <div id={id + '-m'} className={`cc-field-msg ${error ? 'err' : ''}`} role={error ? 'alert' : undefined}>{msg}</div>}
    </div>
  )
}
