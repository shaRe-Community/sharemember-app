import { useState, useCallback, useEffect, useRef, CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { CameraModal } from './CameraModal'

interface ProfilePictureEditorProps {
  currentPicture: string | null
  onUpload: (blob: Blob) => Promise<void>
  isUploading: boolean
}

interface ImageState {
  width: number
  height: number
  element: HTMLImageElement
}

// Fix 6: module-level constant instead of per-render `const size = 200`
const EDITOR_SIZE = 200

export function ProfilePictureEditor({
  currentPicture,
  onUpload,
  isUploading,
}: ProfilePictureEditorProps): JSX.Element {
  const { t } = useTranslation()

  const [imageState, setImageState] = useState<ImageState | null>(null)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [initialPosition, setInitialPosition] = useState({ x: 0, y: 0 })
  const [scaleRange, setScaleRange] = useState({ min: 1, max: 1 })
  const [zoomValue, setZoomValue] = useState(0)
  const [blob, setBlob] = useState<Blob | null>(null)
  const [cameraOpen, setCameraOpen] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const editorRef = useRef<HTMLDivElement>(null)

  // Fix 1: Draw canvas and export blob in one effect — toBlob() always captures
  // the freshly painted frame, eliminating the race condition between two effects.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, EDITOR_SIZE, EDITOR_SIZE)

    if (!imageState) {
      ctx.fillStyle = '#1e2a4a'
      ctx.beginPath()
      ctx.arc(EDITOR_SIZE / 2, EDITOR_SIZE / 2, EDITOR_SIZE / 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,0.3)'
      ctx.font = `${EDITOR_SIZE / 3}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('＋', EDITOR_SIZE / 2, EDITOR_SIZE / 2)
      return
    }

    ctx.save()
    ctx.beginPath()
    ctx.arc(EDITOR_SIZE / 2, EDITOR_SIZE / 2, EDITOR_SIZE / 2, 0, Math.PI * 2)
    ctx.clip()
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, EDITOR_SIZE, EDITOR_SIZE)
    ctx.translate(EDITOR_SIZE / 2 + position.x, EDITOR_SIZE / 2 + position.y)
    ctx.scale(scale, scale)
    ctx.drawImage(
      imageState.element,
      -imageState.width / 2,
      -imageState.height / 2,
      imageState.width,
      imageState.height
    )
    ctx.restore()

    // Export blob after drawing — always captures the freshly painted frame
    canvas.toBlob(b => {
      if (b) setBlob(b)
    }, 'image/png')
  }, [imageState, scale, position])

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = ev => {
        const result = ev.target?.result
        if (typeof result !== 'string') return
        const img = new Image()
        img.onload = () => {
          const w = img.naturalWidth
          const h = img.naturalHeight
          // Fix 3: apply 0.8 factor twice to give more zoom-out room for repositioning
          const minScale =
            Math.max(EDITOR_SIZE / w, EDITOR_SIZE / h) * 0.8 * 0.8
          const maxScale = Math.min(w / EDITOR_SIZE, h / EDITOR_SIZE)
          // Fix 4: removed unused `src` field from ImageState
          setImageState({ width: w, height: h, element: img })
          setScaleRange({ min: minScale, max: Math.max(minScale, maxScale) })
          setScale(minScale)
          setPosition({ x: 0, y: 0 })
          setZoomValue(0)
        }
        img.src = result
      }
      reader.readAsDataURL(file)
    },
    []
  )

  const loadImageFromUrl = useCallback(
    (dataURL: string) => {
      const img = new Image()
      img.onload = () => {
        const w = img.naturalWidth
        const h = img.naturalHeight
        const minScale = Math.max(EDITOR_SIZE / w, EDITOR_SIZE / h) * 0.8 * 0.8
        const maxScale = Math.min(w / EDITOR_SIZE, h / EDITOR_SIZE)
        setImageState({ width: w, height: h, element: img })
        setScaleRange({ min: minScale, max: Math.max(minScale, maxScale) })
        setScale(minScale)
        setPosition({ x: 0, y: 0 })
        setZoomValue(0)
      }
      img.src = dataURL
    },
    [],
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!imageState || !editorRef.current) return
      setIsDragging(true)
      const rect = editorRef.current.getBoundingClientRect()
      setDragStart({
        x: e.clientX - (rect.left + rect.width / 2),
        y: e.clientY - (rect.top + rect.height / 2),
      })
      setInitialPosition(position)
    },
    [imageState, position]
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !editorRef.current) return
      const rect = editorRef.current.getBoundingClientRect()
      const offsetX = e.clientX - (rect.left + rect.width / 2)
      const offsetY = e.clientY - (rect.top + rect.height / 2)
      setPosition({
        x: initialPosition.x + offsetX - dragStart.x,
        y: initialPosition.y + offsetY - dragStart.y,
      })
    },
    [isDragging, dragStart, initialPosition]
  )

  const handleMouseUp = useCallback(() => setIsDragging(false), [])

  // Fix 2: touch handlers for mobile drag support
  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (!imageState || !editorRef.current) return
      const touch = e.touches[0]
      if (!touch) return
      setIsDragging(true)
      const rect = editorRef.current.getBoundingClientRect()
      setDragStart({
        x: touch.clientX - (rect.left + rect.width / 2),
        y: touch.clientY - (rect.top + rect.height / 2),
      })
      setInitialPosition(position)
    },
    [imageState, position]
  )

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging || !editorRef.current) return
      e.preventDefault()
      const touch = e.touches[0]
      if (!touch) return
      const rect = editorRef.current.getBoundingClientRect()
      const offsetX = touch.clientX - (rect.left + rect.width / 2)
      const offsetY = touch.clientY - (rect.top + rect.height / 2)
      setPosition({
        x: initialPosition.x + offsetX - dragStart.x,
        y: initialPosition.y + offsetY - dragStart.y,
      })
    },
    [isDragging, dragStart, initialPosition]
  )

  const handleTouchEnd = useCallback(() => setIsDragging(false), [])

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    // Fix 2: passive: false so e.preventDefault() can block page scroll during drag
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd])

  // Fix 5: wrap handleZoom in useCallback
  const handleZoom = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = parseFloat(e.target.value)
      setZoomValue(v)
      setScale(scaleRange.min * Math.pow(scaleRange.max / scaleRange.min, v))
    },
    [scaleRange]
  )

  const editorStyle: CSSProperties = {
    width: EDITOR_SIZE,
    height: EDITOR_SIZE,
    borderRadius: '50%',
    overflow: 'hidden',
    cursor: imageState ? 'move' : 'pointer',
    border: '2px solid rgba(255,255,255,0.15)',
    flexShrink: 0,
  }

  return (
    <div className="avatar-editor">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      <div
        ref={editorRef}
        style={editorStyle}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onClick={() => {
          if (!imageState) fileInputRef.current?.click()
        }}
        tabIndex={!imageState ? 0 : undefined}
        role={!imageState ? 'button' : undefined}
        aria-label={!imageState ? t('settings.picture_select') : undefined}
        onKeyDown={
          !imageState
            ? e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  fileInputRef.current?.click()
                }
              }
            : undefined
        }
      >
        <canvas
          ref={canvasRef}
          width={EDITOR_SIZE}
          height={EDITOR_SIZE}
          style={{ display: 'block' }}
        />
      </div>

      <div className="avatar-editor-controls">
        {currentPicture && !imageState && (
          <div className="avatar-current">
            {/* Fix 7: meaningful alt text instead of empty string */}
            <img
              src={currentPicture}
              alt={t('settings.picture_current')}
              className="avatar-current-img"
            />
            <span className="avatar-current-label">
              {t('settings.picture_current')}
            </span>
          </div>
        )}

        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={zoomValue}
          onChange={handleZoom}
          disabled={!imageState}
          className="avatar-zoom-slider"
        />

        <div className="avatar-editor-buttons">
          <button
            type="button"
            className="cta-button cta-button--secondary"
            onClick={() => fileInputRef.current?.click()}
          >
            {imageState
              ? t('settings.picture_change')
              : t('settings.picture_select')}
          </button>

          <button
            type="button"
            className="cta-button cta-button--secondary"
            onClick={() => setCameraOpen(true)}
          >
            {t('settings.picture_camera')}
          </button>

          {imageState && (
            <button
              type="button"
              className="cta-button"
              onClick={() => {
                if (blob) void onUpload(blob)
              }}
              disabled={!blob || isUploading}
            >
              {isUploading
                ? t('settings.picture_uploading')
                : t('settings.picture_upload')}
            </button>
          )}
        </div>
      </div>

      {cameraOpen && (
        <CameraModal
          onCapture={(dataURL) => { loadImageFromUrl(dataURL); setCameraOpen(false) }}
          onClose={() => setCameraOpen(false)}
        />
      )}
    </div>
  )
}
