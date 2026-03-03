import { useState, useRef, useCallback, useEffect } from 'react'

interface CameraError {
  message: string
  help: string
}

const getErrorDetails = (errorName: string): CameraError => {
  switch (errorName) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
      return { message: 'error_permission', help: '' }
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return { message: 'error_not_found', help: '' }
    case 'NotReadableError':
    case 'TrackStartError':
      return { message: 'error_in_use', help: '' }
    default:
      return { message: 'error_generic', help: '' }
  }
}

const isMobile = (): boolean =>
  /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

export function useCamera() {
  const [isCapturing, setIsCapturing] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([])
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null)
  const [cameraError, setCameraError] = useState<CameraError | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const captureCanvasRef = useRef<HTMLCanvasElement>(null)

  // Enumerate cameras after first getUserMedia call (labels only available after permission)
  const enumerateCameras = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return
    const devices = await navigator.mediaDevices.enumerateDevices()
    const cameras = devices.filter((d) => d.kind === 'videoinput')
    setAvailableCameras(cameras)
  }, [])

  const startCamera = useCallback(async (deviceId?: string) => {
    setIsCapturing(true)
    setCameraError(null)

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw Object.assign(new Error(), { name: 'NotSupportedError' })
      }

      const videoConstraints: MediaTrackConstraints = deviceId
        ? { deviceId: { exact: deviceId } }
        : isMobile()
          ? { facingMode }
          : { width: { ideal: 1280 }, height: { ideal: 720 } }

      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints })
      setStream(mediaStream)
      await enumerateCameras()

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        await videoRef.current.play()
      }
    } catch (err: any) {
      setIsCapturing(false)
      setCameraError(getErrorDetails(err?.name ?? ''))
    }
  }, [facingMode, enumerateCameras])

  const stopCamera = useCallback(() => {
    stream?.getTracks().forEach((t) => t.stop())
    setStream(null)
    setIsCapturing(false)
    setCameraError(null)
    if (videoRef.current) videoRef.current.srcObject = null
  }, [stream])

  const capturePhoto = useCallback((): string => {
    const video = videoRef.current
    const canvas = captureCanvasRef.current
    if (!video || !canvas) return ''
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    const dataURL = canvas.toDataURL('image/jpeg', 0.9)
    stopCamera()
    return dataURL
  }, [stopCamera])

  const flipCamera = useCallback(() => {
    if (!isCapturing) return
    stopCamera()
    if (isMobile()) {
      const next = facingMode === 'environment' ? 'user' : 'environment'
      setFacingMode(next)
      setTimeout(() => void startCamera(), 150)
    } else {
      const currentIdx = availableCameras.findIndex((c) => c.deviceId === selectedCameraId)
      const next = availableCameras[(currentIdx + 1) % availableCameras.length]
      if (next) {
        setSelectedCameraId(next.deviceId)
        setTimeout(() => void startCamera(next.deviceId), 150)
      }
    }
  }, [isCapturing, facingMode, availableCameras, selectedCameraId, stopCamera, startCamera])

  // Auto-stop on unmount
  useEffect(() => {
    return () => {
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [stream])

  const clearError = useCallback(() => setCameraError(null), [])

  const showFlip = isMobile() || availableCameras.length > 1

  return {
    isCapturing,
    stream,
    facingMode,
    availableCameras,
    cameraError,
    videoRef,
    captureCanvasRef,
    startCamera,
    stopCamera,
    capturePhoto,
    flipCamera,
    clearError,
    showFlip,
  }
}
