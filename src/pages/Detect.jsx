import { Link } from 'react-router-dom'
import { Image, Video, Link2, ChevronRight } from 'lucide-react'

const options = [
  {
    to: '/detect/image',
    icon: Image,
    title: 'Analyze Image',
    desc: 'Upload a photo or screenshot for deepfake detection. Supports JPEG, PNG, and WebP formats.',
    formats: ['JPG', 'JPEG', 'PNG', 'WEBP'],
    color: '#2563eb',
    bg: '#eff6ff',
    action: 'Analyze Image'
  },
  {
    to: '/detect/video',
    icon: Video,
    title: 'Analyze Video',
    desc: 'Upload a video for frame-by-frame AI analysis with audio and metadata forensics.',
    formats: ['MP4', 'MOV', 'AVI', 'MKV'],
    color: '#7c3aed',
    bg: '#f5f3ff',
    action: 'Analyze Video'
  },
  {
    to: '/detect/url',
    icon: Link2,
    title: 'Analyze URL',
    desc: 'Paste a direct media URL from any platform to analyze without downloading the file.',
    formats: ['HTTP', 'HTTPS', 'Direct Media Links'],
    color: '#0891b2',
    bg: '#ecfeff',
    action: 'Analyze URL'
  }
]

export default function Detect() {
  return (
    <div className="animate-slideUp">
      <div className="page-header">
        <h1 className="page-title">Detect Content</h1>
        <p className="page-subtitle">
          Choose an analysis method to start deepfake detection
        </p>
      </div>

      <div
        style={{
          background: 'linear-gradient(135deg, #eff6ff, #f0fdf4)',
          border: '1px solid var(--blue-border)',
          borderRadius: 'var(--radius-xl)',
          padding: '16px 20px',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          fontSize: 13.5
        }}
      >
        <span className="demo-badge">DEMO ANALYSIS</span>
        <span style={{ color: 'var(--text-secondary)' }}>
          Uploads are simulated in demo mode. No real AI model is invoked. Results are randomly generated for demonstration purposes.
        </span>
      </div>

      <div className="detect-cards">
        {options.map(({ to, icon: Icon, title, desc, formats, color, bg, action }) => (
          <div key={to} className="detect-option-card">
            <div className="detect-option-icon" style={{ background: bg }}>
              <Icon size={30} color={color} />
            </div>
            <h2 className="detect-option-title">{title}</h2>
            <p className="detect-option-desc">{desc}</p>
            <div className="detect-option-formats">
              {formats.map((f) => (
                <span key={f} className="dropzone-format-badge">{f}</span>
              ))}
            </div>
            <Link to={to} className="btn btn-primary" style={{ marginTop: 8, width: '100%' }}>
              <Icon size={14} />
              {action}
              <ChevronRight size={14} />
            </Link>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 24, background: 'linear-gradient(135deg, #f8fafc, #fff)' }}>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {[
            { title: '🔒 Secure Processing', desc: 'Files are processed in an isolated environment and never stored permanently.' },
            { title: '🧬 Evidence Hashing', desc: 'SHA-256 cryptographic hashes are generated for every analyzed file.' },
            { title: '⚡ Fast Analysis', desc: 'Results are typically available within 15–30 seconds per file.' }
          ].map(({ title, desc }) => (
            <div key={title} style={{ flex: '1 1 200px' }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{title}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
