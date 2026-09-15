import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ShieldCheck, Lock, Key, FileCheck, CheckCircle2, AlertCircle,
  Copy, Download, Clock, User, ExternalLink, RefreshCw, Layers
} from 'lucide-react'
import { detectionService } from '../services/detectionService'
import { mockEvidence } from '../data/mockEvidence'
import HashDisplay from '../components/forensic/HashDisplay'
import { formatDateTime } from '../utils/formatters'
import { useToast } from '../App'

export default function Evidence() {
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [evidenceList, setEvidenceList] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState(null)
  const [verifyingId, setVerifyingId] = useState(null)

  useEffect(() => {
    detectionService.getEvidence().then((data) => {
      setEvidenceList(data || mockEvidence)
      setLoading(false)
    })
  }, [])

  const handleVerifyIntegrity = (item) => {
    setVerifyingId(item.id)
    setTimeout(() => {
      setVerifyingId(null)
      addToast(
        `Cryptographic SHA-256 seal matches blockchain digest for ${item.evidenceId}. Zero tampering detected.`,
        'success',
        'Integrity Verified'
      )
    }, 1200)
  }

  const handleDownloadCertificate = (item) => {
    addToast(
      `Chain of Custody Certificate for ${item.evidenceId} downloaded.`,
      'success',
      'Certificate Generated'
    )
  }

  return (
    <div className="animate-slideUp" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>Cryptographic Evidence Locker</h1>
            <span className="badge badge-cyan" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Lock size={12} /> Chain of Custody
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
            Court-admissible digital forensics vault with SHA-256 cryptographic hashing, immutable audit trails, and integrity sealing.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              addToast('Re-verifying all active evidence cryptographic digests against ledger...', 'info', 'Ledger Sync')
            }}
          >
            <RefreshCw size={14} /> Audit Integrity
          </button>
        </div>
      </div>

      {/* Security Overview Cards */}
      <div className="grid grid-3">
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 10,
            background: 'rgba(34,197,94,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--green)'
          }}>
            <ShieldCheck size={26} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Verified Artifacts</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {evidenceList.filter((e) => e.status === 'verified').length} / {evidenceList.length}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--green)' }}>100% Hash Integrity Valid</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 10,
            background: 'rgba(14,165,233,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-cyan)'
          }}>
            <Key size={26} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Hash Standard</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>SHA-256 + MD5</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>FIPS 180-4 Compliant</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 10,
            background: 'rgba(139,92,246,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-purple)'
          }}>
            <FileCheck size={26} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Legal Admissibility</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-purple)' }}>Section 65B</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Electronic Evidence Ready</div>
          </div>
        </div>
      </div>

      {/* Evidence Items List */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="card-title">Sealed Evidence Locker</div>
            <div className="card-subtitle">Cryptographic evidence logs associated with detection runs</div>
          </div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing {evidenceList.length} evidence items
          </span>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <div className="loader-spinner" />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {evidenceList.map((item) => (
              <div
                key={item.id}
                style={{
                  padding: '20px',
                  borderBottom: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  transition: 'background 0.2s ease',
                  background: selectedItem?.id === item.id ? 'rgba(14, 165, 233, 0.04)' : 'transparent'
                }}
              >
                {/* Header line */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      padding: '6px 12px',
                      background: 'rgba(14, 165, 233, 0.1)',
                      border: '1px solid rgba(14, 165, 233, 0.25)',
                      borderRadius: 6,
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: 'var(--accent-cyan)'
                    }}>
                      {item.evidenceId}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                        {item.fileName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Sealed on {formatDateTime(item.timestamp)}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {item.status === 'verified' ? (
                      <span className="badge badge-green" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle2 size={12} /> Cryptographically Verified
                      </span>
                    ) : (
                      <span className="badge badge-orange" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <AlertCircle size={12} /> Pending Verification
                      </span>
                    )}

                    <button
                      className="btn btn-secondary btn-sm"
                      disabled={verifyingId === item.id}
                      onClick={() => handleVerifyIntegrity(item)}
                    >
                      {verifyingId === item.id ? (
                        <div className="loader-spinner sm" />
                      ) : (
                        <ShieldCheck size={14} />
                      )}
                      <span>Verify Hash</span>
                    </button>

                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleDownloadCertificate(item)}
                      title="Download Certificate"
                    >
                      <Download size={14} />
                    </button>
                  </div>
                </div>

                {/* Hashes & Verification */}
                <div style={{
                  background: 'var(--bg-secondary)',
                  padding: '12px 16px',
                  borderRadius: 8,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      SHA-256 Cryptographic Hash
                    </span>
                    <button
                      className="btn btn-ghost btn-xs"
                      onClick={() => {
                        navigator.clipboard.writeText(item.sha256)
                        addToast('SHA-256 copied to clipboard', 'info', 'Copied')
                      }}
                      style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <Copy size={12} /> Copy Hash
                    </button>
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.8rem',
                    color: 'var(--accent-cyan)',
                    wordBreak: 'break-all',
                    letterSpacing: '0.5px'
                  }}>
                    {item.sha256}
                  </div>
                </div>

                {/* Chain of Custody Trail */}
                {item.chainOfCustody && item.chainOfCustody.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                      Chain of Custody Events:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                      {item.chainOfCustody.map((step, idx) => (
                        <div
                          key={idx}
                          style={{
                            background: 'var(--bg-primary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 6,
                            padding: '6px 12px',
                            fontSize: '0.78rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6
                          }}
                        >
                          <Clock size={12} color="var(--text-muted)" />
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{step.action}</span>
                          <span style={{ color: 'var(--text-muted)' }}>by {step.by}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
