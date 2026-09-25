import api, { isDemoMode, delay } from './api'
import { mockDetections } from '../data/mockDetections'
import { mockEvidence } from '../data/mockEvidence'
import { mockReports } from '../data/mockReports'

const generateEvidenceId = () => {
  const num = Math.floor(Math.random() * 900) + 100
  return `FX-2026-00${num}`
}

const generateHash = () => {
  const chars = '0123456789abcdef'
  return Array.from({ length: 64 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

const getRandomResult = () => {
  const r = Math.random()
  if (r < 0.4) return { result: 'deepfake', risk: 'high', confidence: 85 + Math.random() * 14 }
  if (r < 0.65) return { result: 'suspicious', risk: 'medium', confidence: 45 + Math.random() * 35 }
  return { result: 'real', risk: 'low', confidence: 5 + Math.random() * 25 }
}

export const detectionService = {
  async analyzeImage(file) {
    if (isDemoMode()) {
      await delay(4000) // simulate processing time
      const res = getRandomResult()
      const det = {
        ...mockDetections[0],
        id: 'det_' + Date.now(),
        evidenceId: generateEvidenceId(),
        fileName: file?.name || 'uploaded_image.jpg',
        fileType: 'image',
        fileSize: file ? (file.size / 1024 / 1024).toFixed(1) + ' MB' : '2.4 MB',
        frames: [],
        result: res.result,
        risk: res.risk,
        confidence: parseFloat(res.confidence.toFixed(1)),
        deepfakeProbability: parseFloat(res.confidence.toFixed(1)),
        realProbability: parseFloat((100 - res.confidence).toFixed(1)),
        sha256: generateHash(),
        timestamp: new Date().toISOString()
      }
      // Store in session
      const history = JSON.parse(localStorage.getItem('fakenix_history') || '[]')
      history.unshift(det)
      localStorage.setItem('fakenix_history', JSON.stringify(history))
      return det
    }
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post('/detect/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data?.data !== undefined ? response.data.data : response.data
  },

  async analyzeVideo(file) {
    if (isDemoMode()) {
      await delay(5000)
      const res = getRandomResult()
      const det = {
        ...mockDetections[0],
        id: 'det_' + Date.now(),
        evidenceId: generateEvidenceId(),
        fileName: file?.name || 'uploaded_video.mp4',
        fileType: 'video',
        fileSize: file ? (file.size / 1024 / 1024).toFixed(1) + ' MB' : '48.3 MB',
        result: res.result,
        risk: res.risk,
        confidence: parseFloat(res.confidence.toFixed(1)),
        deepfakeProbability: parseFloat(res.confidence.toFixed(1)),
        realProbability: parseFloat((100 - res.confidence).toFixed(1)),
        sha256: generateHash(),
        timestamp: new Date().toISOString(),
        frames: mockDetections[0].frames
      }
      const history = JSON.parse(localStorage.getItem('fakenix_history') || '[]')
      history.unshift(det)
      localStorage.setItem('fakenix_history', JSON.stringify(history))
      return det
    }
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post('/detect/video', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data?.data !== undefined ? response.data.data : response.data
  },

  async analyzeURL(url) {
    if (isDemoMode()) {
      await delay(3000)
      const res = getRandomResult()
      const det = {
        ...mockDetections[5],
        id: 'det_' + Date.now(),
        evidenceId: generateEvidenceId(),
        fileName: url,
        fileType: 'url',
        sourceUrl: url,
        result: res.result,
        risk: res.risk,
        confidence: parseFloat(res.confidence.toFixed(1)),
        deepfakeProbability: parseFloat(res.confidence.toFixed(1)),
        realProbability: parseFloat((100 - res.confidence).toFixed(1)),
        sha256: generateHash(),
        timestamp: new Date().toISOString()
      }
      const history = JSON.parse(localStorage.getItem('fakenix_history') || '[]')
      history.unshift(det)
      localStorage.setItem('fakenix_history', JSON.stringify(history))
      return det
    }
    const response = await api.post('/detect/url', { url })
    return response.data?.data !== undefined ? response.data.data : response.data
  },

  async getDetectionHistory() {
    if (isDemoMode()) {
      await delay(400)
      const localHistory = JSON.parse(localStorage.getItem('fakenix_history') || '[]')
      return [...localHistory, ...mockDetections]
    }
    const response = await api.get('/detections')
    return response.data?.data !== undefined ? response.data.data : response.data
  },

  async getDetectionResult(id) {
    if (isDemoMode()) {
      await delay(300)
      // Check local first
      const localHistory = JSON.parse(localStorage.getItem('fakenix_history') || '[]')
      const local = localHistory.find((d) => d.id === id)
      if (local) return local
      return mockDetections.find((d) => d.id === id) || mockDetections[0]
    }
    const response = await api.get(`/detections/${id}`)
    return response.data?.data !== undefined ? response.data.data : response.data
  },

  async getEvidence() {
    if (isDemoMode()) {
      await delay(400)
      return mockEvidence
    }
    const response = await api.get('/evidence')
    return response.data?.data !== undefined ? response.data.data : response.data
  },

  async getReports() {
    if (isDemoMode()) {
      await delay(400)
      return mockReports
    }
    const response = await api.get('/reports')
    return response.data?.data !== undefined ? response.data.data : response.data
  },

  async generateReport(detectionId) {
    if (isDemoMode()) {
      await delay(2000)
      const det = await this.getDetectionResult(detectionId)
      return {
        reportId: 'FX-RPT-2026-' + Math.floor(Math.random() * 900 + 100),
        evidenceId: det?.evidenceId || 'FX-2026-00142',
        status: 'ready',
        generatedDate: new Date().toISOString()
      }
    }
    const response = await api.post('/reports', { detectionId })
    return response.data?.data !== undefined ? response.data.data : response.data
  },

  async submitCybercrimeReport(data) {
    if (isDemoMode()) {
      await delay(1500)
      return {
        reportId: 'CC-2026-' + Math.floor(Math.random() * 900 + 100),
        status: 'prepared',
        timestamp: new Date().toISOString(),
        message: 'Incident report prepared successfully.'
      }
    }
    const response = await api.post('/cybercrime/report', data)
    return response.data?.data !== undefined ? response.data.data : response.data
  }
}
