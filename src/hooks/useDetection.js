import { useState, useCallback } from 'react'
import { detectionService } from '../services/detectionService'

export function useDetection() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [progress, setProgress] = useState(0)

  const simulateProgress = (stages) => {
    return new Promise((resolve) => {
      let idx = 0
      const step = () => {
        if (idx <= stages) {
          setProgress(Math.round((idx / stages) * 100))
          idx++
          setTimeout(step, 500)
        } else {
          resolve()
        }
      }
      step()
    })
  }

  const analyzeImage = useCallback(async (file) => {
    setLoading(true)
    setError(null)
    setProgress(0)
    try {
      const res = await detectionService.analyzeImage(file)
      setResult(res)
      setProgress(100)
      return res
    } catch (err) {
      setError(err.message || 'Analysis failed')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const analyzeVideo = useCallback(async (file) => {
    setLoading(true)
    setError(null)
    setProgress(0)
    try {
      const res = await detectionService.analyzeVideo(file)
      setResult(res)
      setProgress(100)
      return res
    } catch (err) {
      setError(err.message || 'Analysis failed')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const analyzeURL = useCallback(async (url) => {
    setLoading(true)
    setError(null)
    setProgress(0)
    try {
      const res = await detectionService.analyzeURL(url)
      setResult(res)
      setProgress(100)
      return res
    } catch (err) {
      setError(err.message || 'Analysis failed')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setResult(null)
    setError(null)
    setProgress(0)
    setLoading(false)
  }, [])

  return {
    loading,
    error,
    result,
    progress,
    analyzeImage,
    analyzeVideo,
    analyzeURL,
    reset
  }
}
