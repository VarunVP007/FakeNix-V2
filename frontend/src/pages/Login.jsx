import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, Cpu, Shield, Brain, CheckCircle } from 'lucide-react'
import { useAppAuth, useToast } from '../App'
import { authService } from '../services/authService'
import { validateEmail } from '../utils/validators'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [remember, setRemember] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const { login } = useAppAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()

  const fillDemo = () => {
    setEmail('demo@fakenix.ai')
    setPassword('Demo@123')
  }

  const validate = () => {
    const errs = {}
    if (!email) errs.email = 'Email is required'
    else if (!validateEmail(email)) errs.email = 'Enter a valid email'
    if (!password) errs.password = 'Password is required'
    else if (password.length < 6) errs.password = 'Password must be at least 6 characters'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const result = await authService.login(email, password)
      login(result.user)
      addToast('Welcome back! Dashboard loaded.', 'success', 'Login Successful')
      navigate('/dashboard')
    } catch (err) {
      setErrors({ general: err.message || 'Login failed. Please try again.' })
      addToast(err.message || 'Login failed', 'error', 'Authentication Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-layout">
      {/* Left */}
      <div className="auth-left">
        <div className="auth-left-logo">FAKENIX</div>
        <h1 className="auth-left-title">A safer internet starts with you.</h1>
        <p className="auth-left-subtitle">
          FAKENIX 2.0 provides enterprise-grade deepfake detection, digital forensics, and cybercrime evidence management.
        </p>
        <div className="auth-feature-list">
          {[
            [Shield, 'AI-powered deepfake detection'],
            [Brain, 'Explainable AI with visual indicators'],
            [CheckCircle, 'Cryptographic evidence integrity'],
            [Cpu, 'Real-time forensic analysis']
          ].map(([Icon, text]) => (
            <div className="auth-feature-item" key={text}>
              <div className="auth-feature-icon">
                <Icon size={14} />
              </div>
              {text}
            </div>
          ))}
        </div>
      </div>

      {/* Right */}
      <div className="auth-right">
        <div className="auth-form-container">
          <h2 className="auth-form-title">Welcome back</h2>
          <p className="auth-form-subtitle">Sign in to your FAKENIX account</p>

          {/* Demo credentials box */}
          <div className="demo-credentials-box">
            <div className="demo-credentials-title">🔑 Demo Credentials</div>
            <div className="demo-credentials-row">
              <span className="demo-credentials-label">Email</span>
              <span className="demo-credentials-value">demo@fakenix.ai</span>
            </div>
            <div className="demo-credentials-row">
              <span className="demo-credentials-label">Password</span>
              <span className="demo-credentials-value">Demo@123</span>
            </div>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              style={{ marginTop: 8, width: '100%' }}
              onClick={fillDemo}
            >
              Use Demo Credentials
            </button>
          </div>

          {errors.general && (
            <div style={{
              background: 'var(--red-bg)',
              border: '1px solid var(--red-border)',
              borderRadius: 'var(--radius)',
              padding: '10px 14px',
              fontSize: 13,
              color: 'var(--red-text)',
              marginBottom: 16
            }}>
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }} noValidate>
            {/* Email */}
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">Email Address</label>
              <div className="input-with-icon">
                <Mail size={15} className="input-icon" />
                <input
                  id="login-email"
                  type="email"
                  className={`form-input ${errors.email ? 'error' : ''}`}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="login-password">Password</label>
              <div className="input-with-icon">
                <Lock size={15} className="input-icon" />
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  className={`form-input ${errors.password ? 'error' : ''}`}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="input-suffix"
                  onClick={() => setShowPass((v) => !v)}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <span className="form-error">{errors.password}</span>}
            </div>

            {/* Remember + Forgot */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  style={{ accentColor: 'var(--brand-primary)' }}
                />
                Remember me
              </label>
              <a href="#" style={{ fontSize: 13, color: 'var(--brand-primary)', fontWeight: 600 }}>
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ padding: '12px', fontSize: 15, fontWeight: 700 }}
            >
              {loading ? <span className="loader-spinner sm" /> : null}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            {/* Divider */}
            <div className="auth-divider">
              <div className="auth-divider-line" />
              <span className="auth-divider-text">or</span>
              <div className="auth-divider-line" />
            </div>

            {/* Google placeholder */}
            <button type="button" className="auth-social-btn" disabled style={{ opacity: 0.6 }}>
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google (Not Available in Demo)
            </button>
          </form>

          <div className="auth-link">
            Don't have an account?{' '}
            <Link to="/register">Create one</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
