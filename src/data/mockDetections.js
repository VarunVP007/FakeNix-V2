export const mockDetections = [
  {
    id: 'det_001',
    evidenceId: 'FX-2026-00142',
    fileName: 'interview_clip.mp4',
    fileType: 'video',
    fileSize: '48.3 MB',
    resolution: '1920x1080',
    duration: '0:42',
    result: 'deepfake',
    risk: 'high',
    confidence: 92.4,
    deepfakeProbability: 92.4,
    realProbability: 7.6,
    model: 'EfficientNet-B4',
    timestamp: '2026-09-11T08:23:14Z',
    sha256: 'a91f4b9e7e8c3d1f4f9e7c2a5b6d8e9f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6',
    indicators: [
      { name: 'Facial boundary inconsistency', severity: 'high', score: 0.91 },
      { name: 'Texture anomaly', severity: 'high', score: 0.88 },
      { name: 'Lighting inconsistency', severity: 'medium', score: 0.74 },
      { name: 'Frame-level artifacts', severity: 'high', score: 0.93 },
      { name: 'Unnatural facial region', severity: 'medium', score: 0.67 }
    ],
    frames: [
      { frameNum: 1, timestamp: '0:00', probability: 91.2, risk: 'high' },
      { frameNum: 24, timestamp: '0:08', probability: 93.1, risk: 'high' },
      { frameNum: 48, timestamp: '0:16', probability: 94.6, risk: 'high' },
      { frameNum: 72, timestamp: '0:24', probability: 90.7, risk: 'high' },
      { frameNum: 96, timestamp: '0:32', probability: 89.3, risk: 'high' },
      { frameNum: 120, timestamp: '0:40', probability: 92.8, risk: 'high' }
    ],
    metadata: {
      format: 'MP4 (H.264)',
      codec: 'H.264 / AVC',
      bitrate: '8.2 Mbps',
      fps: '30',
      audioCodec: 'AAC',
      created: '2026-09-10T14:32:00Z',
      modified: '2026-09-10T14:32:00Z',
      gpsData: 'Not available',
      softwareTag: 'Adobe Premiere Pro 2026',
      exifStripped: false
    }
  },
  {
    id: 'det_002',
    evidenceId: 'FX-2026-00141',
    fileName: 'profile_photo.jpg',
    fileType: 'image',
    fileSize: '2.1 MB',
    resolution: '1024x1024',
    duration: null,
    result: 'real',
    risk: 'low',
    confidence: 8.4,
    deepfakeProbability: 8.4,
    realProbability: 91.6,
    model: 'EfficientNet-B4',
    timestamp: '2026-09-11T07:45:22Z',
    sha256: 'b72e3a8f1c9d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9',
    indicators: [
      { name: 'Face consistency', severity: 'low', score: 0.08 },
      { name: 'Texture quality', severity: 'low', score: 0.12 }
    ],
    frames: [],
    metadata: {
      format: 'JPEG',
      codec: null,
      bitrate: null,
      fps: null,
      audioCodec: null,
      created: '2026-09-09T10:15:00Z',
      modified: '2026-09-09T10:15:00Z',
      gpsData: '28.6139° N, 77.2090° E',
      softwareTag: 'iPhone 16 Pro',
      exifStripped: false
    }
  },
  {
    id: 'det_003',
    evidenceId: 'FX-2026-00140',
    fileName: 'news_clip.mp4',
    fileType: 'video',
    fileSize: '125.7 MB',
    resolution: '1280x720',
    duration: '1:15',
    result: 'suspicious',
    risk: 'medium',
    confidence: 61.8,
    deepfakeProbability: 61.8,
    realProbability: 38.2,
    model: 'EfficientNet-B4',
    timestamp: '2026-09-10T22:11:05Z',
    sha256: 'c83d4b7e2f1a9c8b7a6d5e4f3c2b1a0f9e8d7c6b5a4d3e2f1c0b9a8d7e6f5c4',
    indicators: [
      { name: 'Temporal inconsistency', severity: 'medium', score: 0.58 },
      { name: 'Compression artifact', severity: 'medium', score: 0.63 },
      { name: 'Facial landmark shift', severity: 'medium', score: 0.61 }
    ],
    frames: [
      { frameNum: 1, timestamp: '0:00', probability: 58.4, risk: 'medium' },
      { frameNum: 30, timestamp: '0:10', probability: 63.2, risk: 'medium' },
      { frameNum: 60, timestamp: '0:20', probability: 65.7, risk: 'high' },
      { frameNum: 90, timestamp: '0:30', probability: 59.1, risk: 'medium' }
    ],
    metadata: {
      format: 'MP4 (H.264)',
      codec: 'H.264 / AVC',
      bitrate: '3.8 Mbps',
      fps: '25',
      audioCodec: 'MP3',
      created: '2026-09-08T09:00:00Z',
      modified: '2026-09-10T18:44:00Z',
      gpsData: 'Not available',
      softwareTag: 'Unknown',
      exifStripped: true
    }
  },
  {
    id: 'det_004',
    evidenceId: 'FX-2026-00139',
    fileName: 'speaker_event.mp4',
    fileType: 'video',
    fileSize: '89.2 MB',
    resolution: '1920x1080',
    duration: '2:30',
    result: 'deepfake',
    risk: 'critical',
    confidence: 97.1,
    deepfakeProbability: 97.1,
    realProbability: 2.9,
    model: 'EfficientNet-B4',
    timestamp: '2026-09-10T18:30:00Z',
    sha256: 'd94e5c6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4',
    indicators: [
      { name: 'Facial boundary inconsistency', severity: 'high', score: 0.97 },
      { name: 'Eye blinking anomaly', severity: 'high', score: 0.95 },
      { name: 'Texture anomaly', severity: 'high', score: 0.94 },
      { name: 'Audio-visual sync issue', severity: 'high', score: 0.91 },
      { name: 'GAN fingerprint detected', severity: 'high', score: 0.98 }
    ],
    frames: [],
    metadata: {}
  },
  {
    id: 'det_005',
    evidenceId: 'FX-2026-00138',
    fileName: 'document_scan.jpg',
    fileType: 'image',
    fileSize: '0.8 MB',
    resolution: '2480x3508',
    duration: null,
    result: 'real',
    risk: 'low',
    confidence: 3.2,
    deepfakeProbability: 3.2,
    realProbability: 96.8,
    model: 'EfficientNet-B4',
    timestamp: '2026-09-10T14:20:00Z',
    sha256: 'e05f6d7e8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5',
    indicators: [],
    frames: [],
    metadata: {}
  },
  {
    id: 'det_006',
    evidenceId: 'FX-2026-00137',
    fileName: 'viral_video_url',
    fileType: 'url',
    fileSize: 'N/A',
    resolution: '1280x720',
    duration: '0:55',
    result: 'suspicious',
    risk: 'medium',
    confidence: 54.3,
    deepfakeProbability: 54.3,
    realProbability: 45.7,
    sourceUrl: 'https://example-social.com/video/12345',
    model: 'EfficientNet-B4',
    timestamp: '2026-09-10T11:05:00Z',
    sha256: 'f16a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6',
    indicators: [],
    frames: [],
    metadata: {}
  }
]

export const recentAlerts = [
  {
    id: 'alert_001',
    type: 'deepfake',
    message: 'Critical deepfake detected in speaker_event.mp4',
    time: '2 hours ago',
    read: false
  },
  {
    id: 'alert_002',
    type: 'report',
    message: 'Forensic report FX-RPT-2026-024 generated successfully',
    time: '4 hours ago',
    read: false
  },
  {
    id: 'alert_003',
    type: 'evidence',
    message: 'Evidence integrity verified for FX-2026-00142',
    time: '6 hours ago',
    read: true
  },
  {
    id: 'alert_004',
    type: 'suspicious',
    message: 'Suspicious media detected in news_clip.mp4',
    time: '1 day ago',
    read: true
  }
]

export const detectionTrend = [
  { date: 'Sep 1', real: 12, deepfake: 4, suspicious: 2 },
  { date: 'Sep 2', real: 8, deepfake: 6, suspicious: 3 },
  { date: 'Sep 3', real: 15, deepfake: 3, suspicious: 1 },
  { date: 'Sep 4', real: 10, deepfake: 7, suspicious: 4 },
  { date: 'Sep 5', real: 18, deepfake: 5, suspicious: 2 },
  { date: 'Sep 6', real: 6, deepfake: 9, suspicious: 5 },
  { date: 'Sep 7', real: 14, deepfake: 4, suspicious: 2 },
  { date: 'Sep 8', real: 11, deepfake: 8, suspicious: 3 },
  { date: 'Sep 9', real: 9, deepfake: 6, suspicious: 4 },
  { date: 'Sep 10', real: 20, deepfake: 5, suspicious: 1 },
  { date: 'Sep 11', real: 7, deepfake: 10, suspicious: 3 }
]
