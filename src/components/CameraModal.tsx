import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useCamera } from '../useCamera'

interface CameraModalProps {
  onCapture: (dataURL: string) => void
  onClose: () => void
}

export function CameraModal({ onCapture, onClose }: CameraModalProps): JSX.Element {
  const { t } = useTranslation()
  const {
    stream,
    cameraError,
    videoRef,
    captureCanvasRef,
    startCamera,
    stopCamera,
    capturePhoto,
    flipCamera,
    showFlip,
  } = useCamera()

  // Start camera on mount, stop on unmount
  useEffect(() => {
    void startCamera()
    return () => stopCamera()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCapture = () => {
    const dataURL = capturePhoto()
    if (dataURL) onCapture(dataURL)
  }

  const handleClose = () => {
    stopCamera()
    onClose()
  }

  // SVG mask: full rect minus centred circle
  // Circle radius = 40% of viewBox (so diameter = 80% of width)
  const maskCircle = (
    <svg
      className="camera-svg-mask"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        fill="rgba(0,0,0,0.55)"
        d="M0,0 H100 V100 H0 Z M50,5 m-40,40 a40,40 0 1,0 80,0 a40,40 0 1,0 -80,0"
      />
      <circle
        cx="50" cy="50" r="40"
        fill="none"
        stroke="rgba(255,255,255,0.5)"
        strokeWidth="0.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )

  return (
    <div className="camera-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}>
      <div className="camera-modal">
        <p className="camera-modal-title">{t('camera.title')}</p>

        <div className="camera-video-wrapper">
          <video
            ref={videoRef}
            className="camera-video"
            autoPlay
            muted
            playsInline
          />
          {maskCircle}
          {!stream && !cameraError && (
            <div className="camera-loading">
              <div className="camera-spinner" />
              <span>{t('camera.loading')}</span>
            </div>
          )}
        </div>

        {cameraError && (
          <div className="camera-error">
            {t(`camera.${cameraError.message}`)}
          </div>
        )}

        <div className="camera-buttons">
          {showFlip && (
            <button
              type="button"
              className="cta-button cta-button--secondary"
              onClick={flipCamera}
              disabled={!stream}
            >
              ↺ {t('camera.flip')}
            </button>
          )}
          <button
            type="button"
            className="cta-button"
            onClick={handleCapture}
            disabled={!stream}
          >
            {t('camera.capture')}
          </button>
          <button
            type="button"
            className="cta-button cta-button--secondary"
            onClick={handleClose}
          >
            ✕
          </button>
        </div>

        <canvas ref={captureCanvasRef} style={{ display: 'none' }} />
      </div>
    </div>
  )
}
