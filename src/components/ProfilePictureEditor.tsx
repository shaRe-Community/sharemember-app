import { useState, useCallback, useEffect, useRef, CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'

interface ProfilePictureEditorProps {
  currentPicture: string | null
  onUpload: (blob: Blob) => Promise<void>
  isUploading: boolean
}

interface ImageState {
  src: string
  width: number
  height: number
  element: HTMLImageElement
}

export function ProfilePictureEditor({
  currentPicture,
  onUpload,
  isUploading,
}: ProfilePictureEditorProps): JSX.Element {
  const { t } = useTranslation()
  const size = 200

  const [imageState, setImageState] = useState<ImageState | null>(null)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [initialPosition, setInitialPosition] = useState({ x: 0, y: 0 })
  const [scaleRange, setScaleRange] = useState({ min: 1, max: 1 })
  const [zoomValue, setZoomValue] = useState(0)
  const [blob, setBlob] = useState<Blob | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const editorRef = useRef<HTMLDivElement>(null)

  // Draw canvas whenever image/scale/position changes
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, size, size)

    if (!imageState) {
      // Draw placeholder circle
      ctx.fillStyle = '#1e2a4a'
      ctx.beginPath()
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,0.3)'
      ctx.font = `${size / 3}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('＋', size / 2, size / 2)
      return
    }

    ctx.save()
    ctx.beginPath()
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
    ctx.clip()
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, size, size)
    ctx.translate(size / 2 + position.x, size / 2 + position.y)
    ctx.scale(scale, scale)
    ctx.drawImage(
      imageState.element,
      -imageState.width / 2,
      -imageState.height / 2,
      imageState.width,
      imageState.height,
    )
    ctx.restore()
  }, [imageState, scale, position, size])

  // Export blob whenever canvas changes
  useEffect(() => {
    if (!imageState) return
    canvasRef.current?.toBlob((b) => {
      if (b) setBlob(b)
    }, 'image/png')
  }, [imageState, scale, position])

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (ev) => {
        const result = ev.target?.result
        if (typeof result !== 'string') return
        const img = new Image()
        img.onload = () => {
          const w = img.naturalWidth
          const h = img.naturalHeight
          const minScale = Math.max(size / w, size / h) * 0.8
          const maxScale = Math.min(w / size, h / size)
          setImageState({ src: result, width: w, height: h, element: img })
          setScaleRange({ min: minScale, max: Math.max(minScale, maxScale) })
          setScale(minScale)
          setPosition({ x: 0, y: 0 })
          setZoomValue(0)
        }
        img.src = result
      }
      reader.readAsDataURL(file)
    },
    [size],
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
    [imageState, position],
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
    [isDragging, dragStart, initialPosition],
  )

  const handleMouseUp = useCallback(() => setIsDragging(false), [])

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  const handleZoom = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value)
    setZoomValue(v)
    setScale(scaleRange.min * Math.pow(scaleRange.max / scaleRange.min, v))
  }

  const editorStyle: CSSProperties = {
    width: size,
    height: size,
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
        onClick={() => { if (!imageState) fileInputRef.current?.click() }}
      >
        <canvas ref={canvasRef} width={size} height={size} style={{ display: 'block' }} />
      </div>

      <div className="avatar-editor-controls">
        {currentPicture && !imageState && (
          <div className="avatar-current">
            <img src={currentPicture} alt="" className="avatar-current-img" />
            <span className="avatar-current-label">{t('settings.picture_current')}</span>
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
            {imageState ? t('settings.picture_change') : t('settings.picture_select')}
          </button>

          {imageState && (
            <button
              type="button"
              className="cta-button"
              onClick={() => { if (blob) void onUpload(blob) }}
              disabled={!blob || isUploading}
            >
              {isUploading ? t('settings.picture_uploading') : t('settings.picture_upload')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
