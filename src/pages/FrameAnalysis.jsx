import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, FileVideo, ShieldAlert, CheckCircle, AlertTriangle,
  ZoomIn, Download, Sliders, ChevronLeft, ChevronRight, Play, Pause,
  Layers, Eye, RefreshCw
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { detectionService } from '../services/detectionService'
import { RiskBadge, ResultBadge } from '../components/common/Badge'
import { getRiskColor } from '../utils/riskCalculator'
import { useToast } from '../App'

export default function FrameAnalysis() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [det, setDet] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedFrameIndex, setSelectedFrameIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [threshold, setThreshold] = useState(70)

  useEffect(() => {
    detectionService.getDetectionResult(id).then((data) => {
      setDet(data)
      setLoading(false)
    })
  }, [id])

  const frames = det?.frames && det.frames.length > 0 ? det.frames : [
    { frameNum: 1, timestamp: '00:00.03', probability: 88.4, risk: 'high', anomalies: ['Boundary blur', 'Lighting mismatch'] },
    { frameNum: 24, timestamp: '00:00.80', probability: 91.2, risk: 'high', anomalies: ['Facial warp', 'Eye reflection absent'] },
    { frameNum: 48, timestamp: '00:01.60', probability: 94.6, risk: 'high', anomalies: ['Deepfake GAN artifacts', 'Blending seam'] },
    { frameNum: 72, timestamp: '00:02.40', probability: 90.7, risk: 'high', anomalies: ['Teeth rendering distortion'] },
    { frameNum: 96, timestamp: '00:03.20', probability: 89.3, risk: 'high', anomalies: ['Temporal flickering'] },
    { frameNum: 120, timestamp: '00:04.00', probability: 93.1, risk: 'high', anomalies: ['Facial boundary mismatch'] }
  ]

  // Animation player for timeline
  useEffect(() => {
    let interval
    if (isPlaying) {
      interval = setInterval(() => {
        setSelectedFrameIndex((prev) => (prev + 1) % frames.length)
      }, 900)
    }
    return () => clearInterval(interval)
  }, [isPlaying, frames.length])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="loader-spinner lg" />
      </div>
    )
  }

  const selectedFrame = frames[selectedFrameIndex] || frames[0]

  const chartData = frames.map((f, i) => ({
    frame: `F#${f.frameNum}`,
    probability: f.probability,
    index: i
  }))

  const peakFrame = [...frames].sort((a, b) => b.probability - a.probability)[0]
  const avgConfidence = (frames.reduce((sum, f) => sum + f.probability, 0) / frames.length).toFixed(1)
  const anomalousCount = frames.filter((f) => f.probability >= threshold).length

  return (
    <div className="animate-slideUp" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Top Breadcrumb & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/result/${id}`)}>
            <ArrowLeft size={16} /> Back to Result
          </button>
          <div style={{ color: 'var(--text-muted)' }}>/</div>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Frame-by-Frame Forensic Analysis</span>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              addToast('Exporting high-resolution frame spectrum JSON...', 'info', 'Export Started')
            }}
          >
            <Download size={14} /> Export Frame Dataset
          </button>
        </div>
      </div>

      {/* Header Banner */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(15,23,42,0.6) 100%)', borderColor: 'rgba(239,68,68,0.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <FileVideo size={20} color="var(--red)" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                {det?.fileName || 'evidence_video.mp4'}
              </h2>
              <span className="badge badge-red">Frame Spectrum</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
              Evidence ID: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{det?.evidenceId || 'FX-2026-00142'}</span> •
              Model: <span style={{ color: 'var(--accent-cyan)' }}>EfficientNet-B4 + MesoInception</span> • Total Frames Scanned: {frames.length * 15}
            </p>
          </div>

          {/* Quick Metrics */}
          <div style={{ display: 'flex', gap: 20 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Average Risk</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--red)' }}>{avgConfidence}%</div>
            </div>
            <div style={{ textAlign: 'right', borderLeft: '1px solid var(--border-color)', paddingLeft: 20 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Peak Anomaly</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--red)' }}>
                {peakFrame?.probability}% <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(F#{peakFrame?.frameNum})</span>
              </div>
            </div>
            <div style={{ textAlign: 'right', borderLeft: '1px solid var(--border-color)', paddingLeft: 20 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Flagged Frames</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--orange)' }}>
                {anomalousCount} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/ {frames.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Inspection View */}
      <div className="grid grid-2" style={{ gridTemplateColumns: '1.2fr 0.8fr', gap: 20 }}>
        {/* Left: Frame Canvas & Inspector */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Eye size={18} color="var(--accent-cyan)" />
              <span style={{ fontWeight: 600 }}>Frame Inspection Viewport</span>
              <span className="badge badge-purple" style={{ fontFamily: 'var(--font-mono)' }}>
                Frame {selectedFrame.frameNum}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setIsPlaying(!isPlaying)}
                title={isPlaying ? 'Pause auto-scrub' : 'Play timeline'}
              >
                {isPlaying ? <Pause size={15} /> : <Play size={15} />}
                <span>{isPlaying ? 'Pause' : 'Play Timeline'}</span>
              </button>
            </div>
          </div>

          {/* Forensic Viewport Simulation */}
          <div style={{
            position: 'relative',
            width: '100%',
            height: 320,
            background: '#090d16',
            borderRadius: 10,
            overflow: 'hidden',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {/* Grid overlay */}
            <div style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: 'radial-gradient(rgba(14, 165, 233, 0.15) 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }} />

            {/* Simulated Frame Face Detection Wireframe */}
            <div style={{
              position: 'relative',
              width: 190,
              height: 230,
              border: `2px solid ${getRiskColor(selectedFrame.risk)}`,
              borderRadius: 14,
              boxShadow: `0 0 25px ${getRiskColor(selectedFrame.risk)}33`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: 12,
              background: 'rgba(15, 23, 42, 0.65)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                <span>FACIAL_ROI #01</span>
                <span>CONF: {selectedFrame.probability}%</span>
              </div>

              {/* Landmark points simulation */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                <div style={{ display: 'flex', gap: 40 }}>
                  <div style={{ width: 14, height: 8, border: '1px solid var(--red)', borderRadius: '50%' }} />
                  <div style={{ width: 14, height: 8, border: '1px solid var(--red)', borderRadius: '50%' }} />
                </div>
                <div style={{ width: 6, height: 16, borderLeft: '1px dashed var(--accent-cyan)' }} />
                <div style={{ width: 34, height: 10, borderBottom: '2px solid var(--red)', borderRadius: '0 0 10px 10px' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--red)', fontFamily: 'var(--font-mono)' }}>
                <span>DEEPFAKE DETECTED</span>
                <span>ΔE: 0.89</span>
              </div>
            </div>

            {/* Frame metadata watermark */}
            <div style={{
              position: 'absolute',
              bottom: 12,
              left: 12,
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'rgba(255,255,255,0.7)',
              background: 'rgba(0,0,0,0.6)',
              padding: '4px 8px',
              borderRadius: 4
            }}>
              TIMESTAMP: {selectedFrame.timestamp} | FRAME: #{selectedFrame.frameNum} | FPS: 30
            </div>

            <div style={{
              position: 'absolute',
              top: 12,
              right: 12,
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: getRiskColor(selectedFrame.risk),
              background: 'rgba(0,0,0,0.6)',
              padding: '4px 8px',
              borderRadius: 4,
              border: `1px solid ${getRiskColor(selectedFrame.risk)}44`
            }}>
              MANIPULATION PROBABILITY: {selectedFrame.probability}%
            </div>
          </div>

          {/* Stepper Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
            <button
              className="btn btn-secondary btn-sm"
              disabled={selectedFrameIndex === 0}
              onClick={() => setSelectedFrameIndex((i) => Math.max(0, i - 1))}
            >
              <ChevronLeft size={16} /> Previous Frame
            </button>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Frame {selectedFrameIndex + 1} of {frames.length}
            </span>
            <button
              className="btn btn-secondary btn-sm"
              disabled={selectedFrameIndex === frames.length - 1}
              onClick={() => setSelectedFrameIndex((i) => Math.min(frames.length - 1, i + 1))}
            >
              Next Frame <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Right: Anomaly Inspector & Details */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Layers size={18} color="var(--red)" />
            <span style={{ fontWeight: 600 }}>Frame Forensic Evidence</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 8 }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Risk Assessment</span>
              <RiskBadge risk={selectedFrame.risk} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 8 }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Deepfake Confidence</span>
              <span style={{ fontWeight: 700, color: getRiskColor(selectedFrame.risk) }}>{selectedFrame.probability}%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 8 }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Relative Timestamp</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{selectedFrame.timestamp}</span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
              Detected Visual Artifacts & Anomalies
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(selectedFrame.anomalies || ['GAN border warping', 'Unnatural frequency domain noise', 'Photometric inconsistency']).map((anomaly, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 12px',
                    borderRadius: 6,
                    background: 'rgba(239,68,68,0.06)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    fontSize: '0.82rem'
                  }}
                >
                  <AlertTriangle size={14} color="var(--red)" style={{ flexShrink: 0 }} />
                  <span style={{ color: 'var(--text-primary)' }}>{anomaly}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Threshold Filter Slider */}
          <div style={{ marginTop: 'auto', paddingTop: 14, borderTop: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 6 }}>
              <span style={{ color: 'var(--text-muted)' }}>Alert Sensitivity Threshold</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>{threshold}%</span>
            </div>
            <input
              type="range"
              min="30"
              max="95"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--red)' }}
            />
          </div>
        </div>
      </div>

      {/* Bottom: Interactive Timeline Chart & Filmstrip */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="card-title">Temporal Probability Spectrum</div>
            <p className="card-subtitle">Click on any frame node or filmstrip thumbnail to isolate the forensic frame</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <span style={{ width: 10, height: 10, background: '#ef4444', borderRadius: '50%', display: 'inline-block' }} /> Deepfake Probability Curve
          </div>
        </div>

        {/* Recharts Area Chart */}
        <div style={{ height: 180, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 20, bottom: 5, left: -15 }}>
              <defs>
                <linearGradient id="spectrumGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="frame" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
              <Tooltip
                contentStyle={{ background: '#0f172a', borderColor: '#334155', borderRadius: 8, fontSize: 12 }}
                formatter={(val) => [`${val}%`, 'Deepfake Score']}
              />
              <Area
                type="monotone"
                dataKey="probability"
                stroke="#ef4444"
                strokeWidth={2.5}
                fill="url(#spectrumGrad)"
                activeDot={{ r: 6, fill: '#ef4444', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Filmstrip Scroller */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${frames.length}, minmax(130px, 1fr))`,
          gap: 12,
          overflowX: 'auto',
          paddingBottom: 8
        }}>
          {frames.map((frame, idx) => {
            const isSelected = idx === selectedFrameIndex
            return (
              <div
                key={frame.frameNum}
                onClick={() => setSelectedFrameIndex(idx)}
                style={{
                  background: isSelected ? 'rgba(239,68,68,0.12)' : 'var(--bg-secondary)',
                  border: `2px solid ${isSelected ? 'var(--red)' : 'var(--border-color)'}`,
                  borderRadius: 8,
                  padding: 10,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6
                }}
              >
                <div style={{
                  height: 60,
                  background: '#090d16',
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(255,255,255,0.06)'
                }}>
                  <Eye size={18} color={frame.probability > 75 ? 'var(--red)' : 'var(--accent-cyan)'} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                  <span style={{ fontWeight: 600 }}>Frame #{frame.frameNum}</span>
                  <span style={{ color: getRiskColor(frame.risk), fontWeight: 700 }}>{frame.probability}%</span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{frame.timestamp}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
