import React from 'react'
import { ShieldAlert, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo })
    // In production, error reporting services like Sentry can be called here
    console.error('ErrorBoundary caught an unhandled render error:', error, errorInfo)
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    window.location.reload()
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{
            minHeight: '70vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px 20px',
            textAlign: 'center'
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: 'var(--red-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--red)',
              marginBottom: 20
            }}
          >
            <ShieldAlert size={38} />
          </div>

          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 8px', color: 'var(--text-primary)' }}>
            Application Error Encountered
          </h1>

          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '0.95rem',
              maxWidth: 480,
              lineHeight: 1.5,
              margin: '0 auto 24px'
            }}
          >
            An unexpected error interrupted this view. Your session remains secure. You can reload or return to the dashboard.
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 24 }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={this.handleReload}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <RefreshCw size={15} /> Reload Application
            </button>
            <a
              href="/dashboard"
              className="btn btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
              onClick={this.handleReset}
            >
              <Home size={15} /> Go to Dashboard
            </a>
          </div>

          {this.state.error && (
            <div
              style={{
                maxWidth: 640,
                width: '100%',
                background: 'var(--bg-main)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                textAlign: 'left',
                overflow: 'hidden'
              }}
            >
              <button
                type="button"
                onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  background: 'none',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: 'var(--text-muted)'
                }}
              >
                <span>Diagnostic details</span>
                {this.state.showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {this.state.showDetails && (
                <div style={{ padding: '0 16px 16px' }}>
                  <pre
                    style={{
                      margin: 0,
                      padding: 12,
                      background: '#0f172a',
                      color: '#f8fafc',
                      borderRadius: 6,
                      fontSize: 11.5,
                      fontFamily: 'var(--font-mono)',
                      overflowX: 'auto',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all'
                    }}
                  >
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )
    }

    return this.props.children
  }
}
