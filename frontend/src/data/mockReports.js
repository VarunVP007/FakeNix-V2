export const mockReports = [
  {
    id: 'rpt_001',
    reportId: 'FX-RPT-2026-024',
    evidenceId: 'FX-2026-00142',
    detectionId: 'det_001',
    reportType: 'Forensic Analysis',
    detection: 'Deepfake',
    confidence: 92.4,
    risk: 'high',
    generatedDate: '2026-09-11T08:30:00Z',
    generatedBy: 'Akash Kumar',
    status: 'ready',
    fileName: 'interview_clip.mp4'
  },
  {
    id: 'rpt_002',
    reportId: 'FX-RPT-2026-023',
    evidenceId: 'FX-2026-00139',
    detectionId: 'det_004',
    reportType: 'Forensic Analysis',
    detection: 'Deepfake',
    confidence: 97.1,
    risk: 'critical',
    generatedDate: '2026-09-10T18:45:00Z',
    generatedBy: 'Akash Kumar',
    status: 'ready',
    fileName: 'speaker_event.mp4'
  },
  {
    id: 'rpt_003',
    reportId: 'FX-RPT-2026-022',
    evidenceId: 'FX-2026-00140',
    detectionId: 'det_003',
    reportType: 'Forensic Analysis',
    detection: 'Suspicious',
    confidence: 61.8,
    risk: 'medium',
    generatedDate: '2026-09-10T23:00:00Z',
    generatedBy: 'Akash Kumar',
    status: 'generating',
    fileName: 'news_clip.mp4'
  },
  {
    id: 'rpt_004',
    reportId: 'FX-RPT-2026-021',
    evidenceId: 'FX-2026-00141',
    detectionId: 'det_002',
    reportType: 'Authenticity Certificate',
    detection: 'Real',
    confidence: 91.6,
    risk: 'low',
    generatedDate: '2026-09-11T07:50:00Z',
    generatedBy: 'Akash Kumar',
    status: 'ready',
    fileName: 'profile_photo.jpg'
  }
]

export const mockCybercrimeReports = [
  {
    id: 'ccr_001',
    reportId: 'CC-2026-001',
    incidentType: 'Deepfake',
    description: 'Deepfake video of public figure used to spread misinformation on social media.',
    date: '2026-09-10',
    platform: 'Social Media',
    evidenceId: 'FX-2026-00142',
    status: 'prepared',
    timestamp: '2026-09-11T09:00:00Z'
  }
]
