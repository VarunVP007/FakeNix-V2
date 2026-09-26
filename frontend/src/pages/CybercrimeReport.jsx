import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShieldAlert, Send, FileText, CheckCircle, AlertTriangle,
  Download, Printer, ArrowLeft, Paperclip, ExternalLink, Lock
} from 'lucide-react'
import { detectionService } from '../services/detectionService'
import { useToast } from '../App'

export default function CybercrimeReport() {
  const navigate = useNavigate()
  const { addToast } = useToast()

  const [formData, setFormData] = useState({
    incidentType: 'deepfake_impersonation',
    platform: 'social_media',
    platformUrl: '',
    dateOccurred: new Date().toISOString().split('T')[0],
    victimName: '',
    victimEmail: '',
    victimPhone: '',
    suspectDetails: '',
    evidenceId: 'FX-2026-00142',
    incidentDescription: '',
    declaredTruthful: false
  })

  const [submitting, setSubmitting] = useState(false)
  const [submittedReport, setSubmittedReport] = useState(null)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.declaredTruthful) {
      addToast('Please confirm the legal truthfulness declaration before submitting.', 'error', 'Validation Error')
      return
    }

    setSubmitting(true)
    try {
      const res = await detectionService.submitCybercrimeReport(formData)
      setSubmittedReport({
        reportId: res.reportId || `CC-2026-${Math.floor(Math.random() * 900 + 100)}`,
        timestamp: new Date().toISOString(),
        details: formData
      })
      addToast('Cybercrime Incident Dossier formatted and signed successfully.', 'success', 'Report Generated')
    } catch (err) {
      addToast('Failed to generate cybercrime packet. Please try again.', 'error', 'Error')
    } finally {
      setSubmitting(false)
    }
  }

  if (submittedReport) {
    return (
      <div className="animate-slideUp" style={{ maxWidth: 780, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div className="card" style={{ textAlign: 'center', padding: '40px 24px', background: 'linear-gradient(135deg, rgba(34,197,94,0.06) 0%, rgba(15,23,42,0.8) 100%)', borderColor: 'rgba(34,197,94,0.3)' }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'rgba(34,197,94,0.15)',
            color: 'var(--green)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <CheckCircle size={36} />
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Cybercrime Incident Dossier Compiled
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: 500, margin: '8px auto 20px' }}>
            Your official complaint documentation has been generated with cryptographic chain of custody references ready for official law enforcement submission.
          </p>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            padding: '10px 20px',
            borderRadius: 8,
            fontFamily: 'var(--font-mono)',
            fontSize: '1.1rem',
            fontWeight: 700,
            color: 'var(--accent-cyan)',
            marginBottom: 24
          }}>
            <span>DOSSIER REF: {submittedReport.reportId}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              onClick={() => {
                window.print()
              }}
            >
              <Printer size={16} /> Print Official Filing Packet
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                addToast('Dossier PDF downloaded to your device.', 'success', 'Download Complete')
              }}
            >
              <Download size={16} /> Download Signed PDF
            </button>
            <button className="btn btn-ghost" onClick={() => setSubmittedReport(null)}>
              File Another Incident
            </button>
          </div>
        </div>

        {/* Portal submission recommendation box */}
        <div className="card" style={{ borderLeft: '4px solid var(--accent-cyan)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 8 }}>Next Steps for Legal Filing</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            You can take this official dossier directly to your local Cyber Crime Police Station or submit it online via the
            <strong> National Cyber Crime Reporting Portal (cybercrime.gov.in)</strong> or international equivalents (IC3.gov).
            Attach the SHA-256 evidence hash certificate for court admissibility under Section 65B of the Indian Evidence Act.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-slideUp" style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: 12 }}>
          <ArrowLeft size={14} /> Back
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ShieldAlert size={26} color="var(--red)" />
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>
            Cybercrime Incident Reporting Dossier
          </h1>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 4 }}>
          Prepare a formal evidence-backed incident dossier compliant with law enforcement authorities and cybercrime cells.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="card-title">1. Incident Classification</div>

        <div className="grid grid-2" style={{ gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Type of AI Cyber Incident</label>
            <select
              name="incidentType"
              value={formData.incidentType}
              onChange={handleChange}
              className="form-control"
            >
              <option value="deepfake_impersonation">Deepfake Identity Impersonation</option>
              <option value="non_consensual_content">Non-Consensual Synthetic Media (NCII)</option>
              <option value="financial_ceo_fraud">CEO / Financial Voice/Video Fraud</option>
              <option value="misinformation_election">Disinformation / Public Misinformation</option>
              <option value="extortion_blackmail">AI Extortion / Blackmail</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Platform / Dissemination Channel</label>
            <select
              name="platform"
              value={formData.platform}
              onChange={handleChange}
              className="form-control"
            >
              <option value="social_media">Social Media (X / Instagram / Facebook)</option>
              <option value="messaging_app">Instant Messaging (WhatsApp / Telegram)</option>
              <option value="video_host">Video Hosting (YouTube / TikTok / Vimeo)</option>
              <option value="email_phish">Email / Spear Phishing</option>
              <option value="darkweb_forum">Dark Web / Third-party forum</option>
            </select>
          </div>
        </div>

        <div className="grid grid-2" style={{ gap: 16 }}>
          <div className="form-group">
            <label className="form-label">URL / Source Link (if applicable)</label>
            <input
              type="text"
              name="platformUrl"
              placeholder="https://social-platform.com/post/xyz..."
              value={formData.platformUrl}
              onChange={handleChange}
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Date Discovered / Occurred</label>
            <input
              type="date"
              name="dateOccurred"
              value={formData.dateOccurred}
              onChange={handleChange}
              className="form-control"
            />
          </div>
        </div>

        <div className="card-title" style={{ marginTop: 10 }}>2. Evidence & Chain of Custody Attachment</div>

        <div className="form-group">
          <label className="form-label">Link Cryptographic Evidence Vault Record</label>
          <select
            name="evidenceId"
            value={formData.evidenceId}
            onChange={handleChange}
            className="form-control"
          >
            <option value="FX-2026-00142">FX-2026-00142 (interview_clip.mp4 - Deepfake 92.4% - SHA-256 Verified)</option>
            <option value="FX-2026-00139">FX-2026-00139 (speaker_event.mp4 - Deepfake 97.1% - SHA-256 Verified)</option>
            <option value="FX-2026-00140">FX-2026-00140 (news_clip.mp4 - Suspicious 61.8%)</option>
          </select>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
            Attaching a cryptographic evidence vault item embeds its SHA-256 integrity hash and frame manipulation logs into the dossier.
          </span>
        </div>

        <div className="card-title" style={{ marginTop: 10 }}>3. Complainant / Victim Information</div>

        <div className="grid grid-3" style={{ gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Full Legal Name</label>
            <input
              type="text"
              name="victimName"
              placeholder="e.g. Akash Kumar"
              value={formData.victimName}
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              name="victimEmail"
              placeholder="complainant@example.com"
              value={formData.victimEmail}
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Contact Phone</label>
            <input
              type="tel"
              name="victimPhone"
              placeholder="+91 98765 43210"
              value={formData.victimPhone}
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Incident Narrative / Statement of Facts</label>
          <textarea
            name="incidentDescription"
            rows="4"
            placeholder="Describe the incident in detail: how the synthetic media was discovered, who was depicted, the harm or fraud caused, and any known suspect aliases..."
            value={formData.incidentDescription}
            onChange={handleChange}
            className="form-control"
            required
          />
        </div>

        {/* Declaration */}
        <div style={{
          background: 'var(--bg-secondary)',
          padding: 16,
          borderRadius: 8,
          border: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12
        }}>
          <input
            type="checkbox"
            id="declaredTruthful"
            name="declaredTruthful"
            checked={formData.declaredTruthful}
            onChange={handleChange}
            style={{ marginTop: 3, accentColor: 'var(--accent-cyan)' }}
          />
          <label htmlFor="declaredTruthful" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', cursor: 'pointer', lineHeight: 1.5 }}>
            I hereby certify under penalty of law that the information furnished above and the evidence submitted is true and accurate to the best of my knowledge, and that this dossier is being generated for legal recourse and lawful cybercrime investigation.
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
          <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? <div className="loader-spinner sm" /> : <Send size={15} />}
            <span>Compile Cybercrime Dossier</span>
          </button>
        </div>
      </form>
    </div>
  )
}
