import api, { isDemoMode, delay } from './api'
import { mockDetections, generateDynamicDetectionTrend } from '../data/mockDetections'
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
    return response.data
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
    return response.data
  },

  async getDetectionTrend(days = 11) {
    try {
      const response = await api.get('/dashboard/detection-trend', { params: { days } })
      if (response?.data?.success && response?.data?.data?.trend) {
        return response.data.data
      }
    } catch (err) {
      console.warn('Backend detection trend query failed or unavailable, using dynamic fallback:', err?.message)
    }

    // Dynamic client-side fallback (computed relative to current date)
    await delay(200)
    const dynamicTrend = generateDynamicDetectionTrend(days)

    // Aggregate any local detections created in session
    try {
      const localHistory = JSON.parse(localStorage.getItem('fakenix_history') || '[]')
      if (Array.isArray(localHistory) && localHistory.length > 0) {
        localHistory.forEach((item) => {
          if (item.timestamp) {
            const itemDate = item.timestamp.slice(0, 10)
            const target = dynamicTrend.find((t) => t.date === itemDate)
            if (target) {
              const res = (item.result || '').toLowerCase()
              if (res === 'real') target.real += 1
              else if (res === 'deepfake') target.deepfake += 1
              else target.suspicious += 1
              target.total += 1
            }
          }
        })
      }
    } catch (e) {
      // Ignore local parse error
    }

    const start = dynamicTrend[0]?.date || ''
    const end = dynamicTrend[dynamicTrend.length - 1]?.date || ''

    return {
      range: { start, end, days },
      trend: dynamicTrend,
      timezone: 'Client/Local'
    }
  },

  async getDetectionHistory() {
    if (isDemoMode()) {
      await delay(400)
      const localHistory = JSON.parse(localStorage.getItem('fakenix_history') || '[]')
      return [...localHistory, ...mockDetections]
    }
    const response = await api.get('/detections')
    return response.data
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
    return response.data
  },

  async getEvidence() {
    if (isDemoMode()) {
      await delay(400)
      return mockEvidence
    }
    const response = await api.get('/evidence')
    return response.data
  },

  async getReports() {
    try {
      const response = await api.get('/reports')
      if (response?.data?.success && Array.isArray(response.data.data) && response.data.data.length > 0) {
        return response.data.data
      }
    } catch (err) {
      console.warn('Backend getReports query failed, using fallback:', err?.message)
    }
    return mockReports
  },

  async generateReport(detectionId) {
    try {
      const response = await api.post('/reports', { detectionId })
      if (response?.data?.success && response?.data?.data) {
        return response.data.data
      }
    } catch (err) {
      console.warn('Backend generateReport failed or unreachable, using fallback:', err?.message)
    }
    const det = await this.getDetectionResult(detectionId)
    return {
      reportId: 'FX-RPT-2026-' + Math.floor(Math.random() * 900 + 100),
      evidenceId: det?.evidenceId || 'FX-2026-00142',
      status: 'ready',
      generatedDate: new Date().toISOString()
    }
  },

  async downloadReport(reportId) {
    const cleanId = reportId || 'FX-RPT-2026-001'
    try {
      const response = await api.get(`/reports/${cleanId}/download`, {
        responseType: 'blob'
      })

      const blob = new Blob([response.data], { type: 'application/pdf' })
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.setAttribute('download', `${cleanId}.pdf`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
      return true
    } catch (err) {
      console.warn('Axios blob download failed, trying direct link download:', err?.message)
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
        const directUrl = `${baseUrl}/reports/${cleanId}/download`
        const link = document.createElement('a')
        link.href = directUrl
        link.setAttribute('download', `${cleanId}.pdf`)
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        return true
      } catch (fallbackErr) {
        console.error('All download attempts failed:', fallbackErr)
        throw fallbackErr
      }
    }
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
    return response.data
  }
}

