import { useState } from 'react'
import {
  Settings as SettingsIcon, User, Cpu, Shield, Key, Bell,
  Save, RefreshCw, CheckCircle, Sliders, Lock
} from 'lucide-react'
import { useAppAuth, useToast } from '../App'

export default function Settings() {
  const { user } = useAppAuth()
  const { addToast } = useToast()

  const [activeTab, setActiveTab] = useState('engine')
  const [engineSettings, setEngineSettings] = useState({
    model: 'efficientnet_b4',
    confidenceThreshold: 75,
    samplingRate: 'medium',
    autoSealEvidence: true,
    audioAnalysisEnabled: true,
    exifPreservation: true
  })

  const [profile, setProfile] = useState({
    name: user?.name || 'Cyber Investigator',
    email: user?.email || 'investigator@cybercell.gov',
    organization: user?.organization || 'Cyber Forensic Bureau',
    role: user?.role || 'Senior Digital Forensics Analyst'
  })

  const [apiKey, setApiKey] = useState('fx_live_9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d')

  const handleSave = (e) => {
    e.preventDefault()
    addToast('Forensic engine settings and preferences saved.', 'success', 'Preferences Updated')
  }

  const handleRegenerateKey = () => {
    const newKey = 'fx_live_' + Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
    setApiKey(newKey)
    addToast('API secret key regenerated. Update active webhook integrations.', 'info', 'Key Regenerated')
  }

  return (
    <div className="animate-slideUp" style={{ maxWidth: 880, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>System Settings & AI Engine Configuration</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 4 }}>
          Fine-tune neural network detection models, sensitivity thresholds, evidence sealing, and developer API credentials.
        </p>
      </div>

      {/* Settings Navigation Tabs */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--border-color)', paddingBottom: 10 }}>
        <button
          className={`btn ${activeTab === 'engine' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
          onClick={() => setActiveTab('engine')}
        >
          <Cpu size={15} /> AI Detection Models
        </button>
        <button
          className={`btn ${activeTab === 'profile' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
          onClick={() => setActiveTab('profile')}
        >
          <User size={15} /> Investigator Profile
        </button>
        <button
          className={`btn ${activeTab === 'api' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
          onClick={() => setActiveTab('api')}
        >
          <Key size={15} /> API & Integrations
        </button>
      </div>

      {/* Tab: Engine Settings */}
      {activeTab === 'engine' && (
        <form onSubmit={handleSave} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div className="card-title">Neural Forensic Engine Calibration</div>

          <div className="form-group">
            <label className="form-label">Primary AI Classification Architecture</label>
            <select
              value={engineSettings.model}
              onChange={(e) => setEngineSettings({ ...engineSettings, model: e.target.value })}
              className="form-control"
            >
              <option value="efficientnet_b4">EfficientNet-B4 + MesoInception (Recommended — 96.8% Benchmark Accuracy)</option>
              <option value="xception_forensics">XceptionNet Deepfake Forensics (High sensitivity to facial boundary seams)</option>
              <option value="resnet50_gan">ResNet-50 GAN Noise Residual Detector (Optimized for latent diffusion artifacts)</option>
            </select>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
              Ensemble weights combine spatial convolutional feature maps with temporal recurrent analysis across sequential video frames.
            </span>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <label className="form-label" style={{ margin: 0 }}>High-Risk Anomaly Sensitivity Threshold</label>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                {engineSettings.confidenceThreshold}%
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="95"
              value={engineSettings.confidenceThreshold}
              onChange={(e) => setEngineSettings({ ...engineSettings, confidenceThreshold: Number(e.target.value) })}
              style={{ width: '100%', accentColor: 'var(--accent-cyan)' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
              <span>50% (High Recall / Aggressive)</span>
              <span>75% (Balanced Recommended)</span>
              <span>95% (High Precision / Conservative)</span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Video Frame Sampling Density</label>
            <select
              value={engineSettings.samplingRate}
              onChange={(e) => setEngineSettings({ ...engineSettings, samplingRate: e.target.value })}
              className="form-control"
            >
              <option value="fast">Rapid Scan (1 keyframe per second — Fast)</option>
              <option value="medium">Balanced Forensics (4 frames per second — Standard)</option>
              <option value="dense">Full Spectrum Forensics (Every frame — Maximum Rigor)</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 10, borderTop: '1px solid var(--border-color)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.85rem' }}>
              <input
                type="checkbox"
                checked={engineSettings.autoSealEvidence}
                onChange={(e) => setEngineSettings({ ...engineSettings, autoSealEvidence: e.target.checked })}
                style={{ accentColor: 'var(--accent-cyan)' }}
              />
              <span>Automatically generate SHA-256 evidence certificate & ledger stamp upon detection completion</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.85rem' }}>
              <input
                type="checkbox"
                checked={engineSettings.audioAnalysisEnabled}
                onChange={(e) => setEngineSettings({ ...engineSettings, audioAnalysisEnabled: e.target.checked })}
                style={{ accentColor: 'var(--accent-cyan)' }}
              />
              <span>Perform neural vocoder spectral analysis on accompanying audio tracks</span>
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
            <button type="submit" className="btn btn-primary">
              <Save size={15} /> Save Engine Configuration
            </button>
          </div>
        </form>
      )}

      {/* Tab: Profile Settings */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSave} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="card-title">Forensic Investigator Credentials</div>

          <div className="grid grid-2" style={{ gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Investigator Name</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Official Email</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="form-control"
              />
            </div>
          </div>

          <div className="grid grid-2" style={{ gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Organization / Agency</label>
              <input
                type="text"
                value={profile.organization}
                onChange={(e) => setProfile({ ...profile, organization: e.target.value })}
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Forensic Role / Title</label>
              <input
                type="text"
                value={profile.role}
                onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                className="form-control"
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
            <button type="submit" className="btn btn-primary">
              <Save size={15} /> Update Profile
            </button>
          </div>
        </form>
      )}

      {/* Tab: API Credentials */}
      {activeTab === 'api' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card-title">Developer & SIEM REST API Credentials</div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
            Use this API key to integrate FAKENIX 2.0 automated deepfake scanning into your corporate SOC, SIEM pipelines, or social media moderation bots.
          </p>

          <div className="form-group">
            <label className="form-label">Production API Secret Key</label>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                type="text"
                readOnly
                value={apiKey}
                className="form-control"
                style={{ fontFamily: 'var(--font-mono)', background: 'var(--bg-secondary)', color: 'var(--accent-cyan)' }}
              />
              <button
                className="btn btn-secondary"
                onClick={() => {
                  navigator.clipboard.writeText(apiKey)
                  addToast('API key copied to clipboard.', 'info', 'Copied')
                }}
              >
                Copy
              </button>
              <button className="btn btn-ghost" onClick={handleRegenerateKey}>
                <RefreshCw size={15} /> Regenerate
              </button>
            </div>
          </div>

          <div style={{ padding: 16, background: 'var(--bg-secondary)', borderRadius: 8 }}>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 6 }}>Example Forensic Scan Request:</div>
            <pre style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', overflowX: 'auto' }}>
              {`curl -X POST https://api.fakenix.ai/v2/detect \\
  -H "Authorization: Bearer ${apiKey}" \\
  -F "file=@surveillance_evidence.mp4"`}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
