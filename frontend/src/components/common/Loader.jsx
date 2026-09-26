export default function Loader({ size = 'md', text = '' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div className={`loader-spinner ${size}`} role="status" aria-label="Loading" />
      {text && <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{text}</p>}
    </div>
  )
}

export function PageLoader() {
  return (
    <div style={{
      minHeight: '50vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <Loader size="lg" text="Loading..." />
    </div>
  )
}
