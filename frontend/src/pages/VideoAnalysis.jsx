import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Video, Shield, ScanSearch, Check } from 'lucide-react'
import UploadDropzone from '../components/detection/UploadDropzone'
import { detectionService } from '../services/detectionService'
import { useToast } from '../App'
import { validateFileType, validateFileSize, VIDEO_TYPES } from '../utils/validators'

const VIDEO_STAGES = [
  'Uploading',
  'Validation',
  'Frame Extraction',
  'AI Analysis',
  'Forensic Analysis',
  'Report Generation'
]

export default function VideoAnalysis() {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [stage, setStage] = useState(0)
  const [error, setError] = useState('')
  const [options, setOptions] = useState({
    frameSampling: true,
    audioAnalysis: true,
    metadataExtraction: true
  })
  const navigate = useNavigate()
  const { addToast } = useToast()

  const handleFile = (f) => {
    setError('')
    if (!f) { setFile(null); return }
    if (!validateFileType(f, VIDEO_TYPES)) {
      setError('Unsupported format. Please upload an MP4, MOV, AVI, or MKV file.')
      return
    }
    if (!validateFileSize(f, 100)) {
      setError('File too large. Maximum file size is 100 MB.')
      return
    }
    setFile(f)
  }

  const handleAnalyze = async () => {
    if (!file) { setError('Please select a file first.'); return }
    setLoading(true)
    setStage(0)
    setError('')

    for (let i = 0; i < VIDEO_STAGES.length; i++) {
      setStage(i)
      await new Promise((r) => setTimeout(r, 850))
    }

    try {
      const result = await detectionService.analyzeVideo(file)
      addToast('Video analysis completed!', 'success', 'Analysis Complete')
      navigate(`/result/${result.id}`, { state: { result } })
    } catch (err) {
      setError('Analysis failed. Please try again.')
      addToast('Analysis failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  const toggle = (key) => setOptions((o) => ({ ...o, [key]: !o[key] }))

  return (
    <div className="animate-slideUp" style={{ maxWidth: 720, margin: '0 auto' }}>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 40, height: 40, background: '#f5f3ff', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Video size={20} color="#7c3aed" />
          </div>
          <div>
            <h1 className="page-title">Video Analysis</h1>
            <p className="page-subtitle">Frame-by-frame AI deepfake detection for videos</p>
          </div>
        </div>
      </div>

      <span className="demo-badge" style={{ marginBottom: 16, display: 'inline-flex' }}>🔬 DEMO ANALYSIS — Results are simulated</span>

      <div className="card" style={{ marginBottom: 20 }}>
        <UploadDropzone
          accept="video/mp4,video/quicktime,video/x-msvideo,video/x-matroska"
          acceptLabel={['MP4', 'MOV', 'AVI', 'MKV']}
          onFile={handleFile}
          file={file}
        />
        {error && (
          <div style={{
            marginTop: 12, background: 'var(--red-bg)', border: '1px solid var(--red-border)',
            borderRadius: 'var(--radius)', padding: '10px 14px',
            fontSize: 13, color: 'var(--red-text)'
          }}>
            {error}
          </div>
        )}
      </div>

      {/* Options */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-title" style={{ marginBottom: 14 }}>Analysis Options</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { key: 'frameSampling', label: 'Frame Sampling', desc: 'Analyze key frames throughout the video' },
            { key: 'audioAnalysis', label: 'Audio Analysis', desc: 'Detect audio tampering and voice cloning' },
            { key: 'metadataExtraction', label: 'Metadata Extraction', desc: 'Extract and analyze file metadata and EXIF data' }
          ].map(({ key, label, desc }) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{label}</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{desc}</div>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={options[key]}
                  onChange={() => toggle(key)}
                />
                <span className="toggle-slider" />
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Security notice */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        background: 'var(--blue-bg)', border: '1px solid var(--blue-border)',
        borderRadius: 'var(--radius)', padding: '12px 16px', marginBottom: 20, fontSize: 13
      }}>
        <Shield size={16} color="var(--brand-primary)" style={{ marginTop: 1, flexShrink: 0 }} />
        <div>
          <strong style={{ color: 'var(--blue-text)' }}>Security Notice</strong>
          <br />
          <span style={{ color: 'var(--text-secondary)' }}>
            Files are securely processed and a cryptographic SHA-256 hash is generated as evidence.
          </span>
        </div>
      </div>

      {loading && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', padding: '16px 0' }}>
            <div className="loader-spinner" />
            <div style={{ fontWeight: 700, fontSize: 15 }}>Analyzing Video...</div>
            <div className="processing-stages" style={{ width: '100%' }}>
              {VIDEO_STAGES.map((s, i) => (
                <div key={s} className={`stage-item ${i < stage ? 'completed' : i === stage ? 'active' : ''}`}>
                  <div className={`stage-icon ${i < stage ? 'completed' : i === stage ? 'active' : 'pending'}`}>
                    {i < stage ? '✓' : i === stage ? '⟳' : i + 1}
                  </div>
                  <span className="stage-name">{s}</span>
                  <span className={`stage-status ${i < stage ? 'done' : i === stage ? 'running' : ''}`}>
                    {i < stage ? 'Complete' : i === stage ? 'Running...' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <button
        className="btn btn-primary"
        style={{ width: '100%', padding: '14px', fontSize: 15, fontWeight: 700 }}
        onClick={handleAnalyze}
        disabled={!file || loading}
        id="analyze-video-btn"
      >
        {loading ? <><span className="loader-spinner sm" /> Analyzing...</> : <><ScanSearch size={16} /> Analyze Video</>}
      </button>
    </div>
  )
}
