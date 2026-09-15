import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Link2, Shield, ScanSearch, Globe } from 'lucide-react'
import { detectionService } from '../services/detectionService'
import { useToast } from '../App'
import { validateURL } from '../utils/validators'

const DEMO_URLS = [
  'https://example-social.com/video/deepfake-123',
  'https://news-platform.net/media/clip_456.mp4',
  'https://video-cdn.example.com/interview_789.mp4'
]

export default function URLAnalysis() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { addToast } = useToast()

  const handleAnalyze = async () => {
    if (!url.trim()) { setError('Please enter a URL.'); return }
    if (!validateURL(url.trim())) { setError('Please enter a valid URL (must start with http:// or https://).'); return }
    setError('')
    setLoading(true)
    try {
      const result = await detectionService.analyzeURL(url.trim())
      addToast('URL analysis completed!', 'success', 'Analysis Complete')
      navigate(`/result/${result.id}`, { state: { result } })
    } catch (err) {
      setError('Analysis failed. Please try again.')
      addToast('URL analysis failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-slideUp" style={{ maxWidth: 720, margin: '0 auto' }}>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 40, height: 40, background: '#ecfeff', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Link2 size={20} color="#0891b2" />
          </div>
          <div>
            <h1 className="page-title">URL Analysis</h1>
            <p className="page-subtitle">Analyze media directly from a URL</p>
          </div>
        </div>
      </div>

      <span className="demo-badge" style={{ marginBottom: 16, display: 'inline-flex' }}>🔬 DEMO ANALYSIS — Results are simulated</span>

      <div className="card" style={{ marginBottom: 20 }}>
        <label className="form-label" htmlFor="media-url">Media URL</label>
        <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
          <div className="input-with-icon" style={{ flex: 1 }}>
            <Globe size={15} className="input-icon" />
            <input
              id="media-url"
              type="url"
              className={`form-input ${error ? 'error' : ''}`}
              placeholder="https://example.com/video.mp4"
              value={url}
              onChange={(e) => { setUrl(e.target.value); setError('') }}
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
            />
          </div>
          <button
            className="btn btn-primary"
            onClick={handleAnalyze}
            disabled={!url.trim() || loading}
            id="analyze-url-btn"
          >
            {loading ? <span className="loader-spinner sm" /> : <ScanSearch size={15} />}
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>
        {error && (
          <div style={{
            marginTop: 10, background: 'var(--red-bg)', border: '1px solid var(--red-border)',
            borderRadius: 'var(--radius)', padding: '10px 14px',
            fontSize: 13, color: 'var(--red-text)'
          }}>
            {error}
          </div>
        )}

        {/* Demo URLs */}
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
            Try Demo URLs
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {DEMO_URLS.map((u) => (
              <button
                key={u}
                className="btn btn-secondary btn-sm"
                style={{ justifyContent: 'flex-start', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: 11 }}
                onClick={() => setUrl(u)}
              >
                {u}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && (
        <div className="card" style={{ marginBottom: 20, textAlign: 'center', padding: 32 }}>
          <div className="loader-spinner lg" style={{ margin: '0 auto 16px' }} />
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>Fetching and Analyzing URL...</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Downloading media · Validating content · Running AI analysis
          </div>
        </div>
      )}

      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        background: 'var(--blue-bg)', border: '1px solid var(--blue-border)',
        borderRadius: 'var(--radius)', padding: '12px 16px', fontSize: 13
      }}>
        <Shield size={16} color="var(--brand-primary)" style={{ marginTop: 1, flexShrink: 0 }} />
        <div>
          <strong style={{ color: 'var(--blue-text)' }}>Security Notice</strong>
          <br />
          <span style={{ color: 'var(--text-secondary)' }}>
            FAKENIX only downloads and analyzes the media file. We do not follow redirect chains or execute any scripts.
            Always verify URLs before submission. Real validation must occur on the Flask backend.
          </span>
        </div>
      </div>
    </div>
  )
}
