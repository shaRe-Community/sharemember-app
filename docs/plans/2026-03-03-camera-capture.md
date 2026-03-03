# Camera Capture for Profile Picture — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a "Foto aufnehmen" button to the profile picture editor that opens a camera modal with live video, a circular crop overlay, and front/back flip support on mobile and multi-camera on desktop.

**Architecture:** New `useCamera.ts` hook manages getUserMedia stream state (adapted from `shaRe-profile-picture-editor/src/hooks/useCamera.ts`). New `CameraModal.tsx` renders the video preview + SVG circular mask + buttons. `ProfilePictureEditor.tsx` adds a second button and a `loadImageFromUrl()` helper — the captured dataURL flows through the same canvas editor path as file upload.

**Tech Stack:** React, TypeScript, getUserMedia API, SVG, react-i18next, existing CSS dark theme

---

### Task 1: i18n keys

**Files:**
- Modify: `src/i18n/locales/de.json` (after line 83, inside `settings` object)
- Modify: `src/i18n/locales/en.json` (after line 83, inside `settings` object)

**Step 1: Add keys to `de.json`** after `"picture_size_error"` line:

```json
    "picture_camera": "Foto aufnehmen",
```

Then add a top-level `"camera"` key at the end of the root object (before the closing `}`):

```json
  "camera": {
    "title": "Foto aufnehmen",
    "capture": "Aufnehmen",
    "flip": "Kamera wechseln",
    "loading": "Kamera wird gestartet…",
    "error_permission": "Kamera-Zugriff verweigert. Bitte erlaube den Kamera-Zugriff in den Browser-Einstellungen.",
    "error_not_found": "Keine Kamera gefunden. Bitte stelle sicher, dass eine Kamera angeschlossen ist.",
    "error_in_use": "Kamera wird bereits verwendet. Schließe andere Apps und versuche es erneut.",
    "error_generic": "Kamera-Fehler. Bitte überprüfe die Berechtigungen und versuche es erneut."
  }
```

**Step 2: Add keys to `en.json`** same structure:

```json
    "picture_camera": "Take photo",
```

```json
  "camera": {
    "title": "Take photo",
    "capture": "Capture",
    "flip": "Flip camera",
    "loading": "Starting camera…",
    "error_permission": "Camera access denied. Please allow camera access in your browser settings.",
    "error_not_found": "No camera found. Please make sure a camera is connected.",
    "error_in_use": "Camera is in use. Close other apps and try again.",
    "error_generic": "Camera error. Please check permissions and try again."
  }
```

**Step 3: Verify** — run `npm run build` (no TypeScript errors, no missing key warnings):
```bash
cd /home/tomblume/IdeaProjects/sharemember-app && npm run build 2>&1 | tail -5
```
Expected: `✓ built in ...`

**Step 4: Commit**
```bash
git add src/i18n/locales/de.json src/i18n/locales/en.json
git commit -m "feat(SM-6d6): add camera i18n keys (DE + EN)"
```

---

### Task 2: `useCamera.ts` hook

**Files:**
- Create: `src/useCamera.ts`

Adapted from `shaRe-profile-picture-editor/src/hooks/useCamera.ts`. Key simplifications: no `CanvasConfig`, no `localStorage`, no `isEnumerating`.

**Step 1: Create `src/useCamera.ts`:**

```typescript
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
```

**Step 2: Verify TypeScript compiles:**
```bash
cd /home/tomblume/IdeaProjects/sharemember-app && npx tsc --noEmit 2>&1 | head -20
```
Expected: no errors

**Step 3: Commit**
```bash
git add src/useCamera.ts
git commit -m "feat(SM-6d6): add useCamera hook (getUserMedia, flip, enumerate)"
```

---

### Task 3: CSS for CameraModal

**Files:**
- Modify: `src/App.css` (append at end)

**Step 1: Append to `src/App.css`:**

```css
/* ── Camera Modal ──────────────────────────────── */
.camera-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.camera-modal {
  background: #031633;
  border-radius: 12px;
  padding: 1.5rem;
  width: min(420px, 95vw);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.camera-modal-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #ffffff;
  text-align: center;
  margin: 0;
}

.camera-video-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.camera-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.camera-svg-mask {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.camera-loading {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.85rem;
}

.camera-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(255, 255, 255, 0.2);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.camera-error {
  background: rgba(220, 38, 38, 0.15);
  border: 1px solid rgba(220, 38, 38, 0.4);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  color: #fca5a5;
  font-size: 0.85rem;
  line-height: 1.4;
}

.camera-buttons {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.camera-buttons .cta-button {
  flex: 1;
  max-width: 140px;
}
```

**Step 2: Verify build:**
```bash
cd /home/tomblume/IdeaProjects/sharemember-app && npm run build 2>&1 | tail -3
```
Expected: `✓ built in ...`

**Step 3: Commit**
```bash
git add src/App.css
git commit -m "feat(SM-6d6): add camera modal CSS"
```

---

### Task 4: `CameraModal.tsx`

**Files:**
- Create: `src/components/CameraModal.tsx`

**Step 1: Create `src/components/CameraModal.tsx`:**

```typescript
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
    clearError,
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
  // Circle radius = 45% of the smaller dimension
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
```

**Step 2: Verify TypeScript:**
```bash
cd /home/tomblume/IdeaProjects/sharemember-app && npx tsc --noEmit 2>&1 | head -20
```
Expected: no errors

**Step 3: Commit**
```bash
git add src/components/CameraModal.tsx
git commit -m "feat(SM-6d6): add CameraModal with live video + circular SVG crop overlay"
```

---

### Task 5: Wire into `ProfilePictureEditor`

**Files:**
- Modify: `src/components/ProfilePictureEditor.tsx`

**Step 1: Add import at top** (after existing imports):
```typescript
import { CameraModal } from './CameraModal'
```

**Step 2: Add `cameraOpen` state** (after the existing `useState` declarations):
```typescript
const [cameraOpen, setCameraOpen] = useState(false)
```

**Step 3: Add `loadImageFromUrl`** (after `handleFileChange`):
```typescript
const loadImageFromUrl = useCallback((dataURL: string) => {
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
}, [])
```

**Step 4: Add camera button** in `avatar-editor-buttons` div, after the existing "Datei hochladen" button:
```tsx
<button
  type="button"
  className="cta-button cta-button--secondary"
  onClick={() => setCameraOpen(true)}
>
  {t('settings.picture_camera')}
</button>
```

**Step 5: Add `CameraModal`** at end of the returned JSX, before the closing `</div>` of `avatar-editor`:
```tsx
{cameraOpen && (
  <CameraModal
    onCapture={(dataURL) => { loadImageFromUrl(dataURL); setCameraOpen(false) }}
    onClose={() => setCameraOpen(false)}
  />
)}
```

**Step 6: Verify TypeScript + build:**
```bash
cd /home/tomblume/IdeaProjects/sharemember-app && npx tsc --noEmit && npm run build 2>&1 | tail -5
```
Expected: no errors, `✓ built in ...`

**Step 7: Commit**
```bash
git add src/components/ProfilePictureEditor.tsx
git commit -m "feat(SM-6d6): wire CameraModal into ProfilePictureEditor"
```

---

### Task 6: Close beads issue + deploy

**Step 1: Close SM-6d6:**
```bash
cd /home/tomblume/IdeaProjects/sharemember-app && bd close SM-6d6 --reason "Camera capture implemented: useCamera hook + CameraModal with SVG circular overlay, getUserMedia, front/back flip on mobile, multi-camera on desktop"
```

**Step 2: Manual smoke test** — open `https://id.wurzelwerk.up2go.com/settings` on mobile and desktop:
- [ ] "Foto aufnehmen" button appears next to "Bild auswählen"
- [ ] Clicking it opens camera modal
- [ ] Circular crop overlay visible on video
- [ ] Capture button disabled until stream starts
- [ ] On mobile: flip button switches front/back camera
- [ ] On desktop with multiple cameras: flip cycles cameras
- [ ] Captured photo loads into canvas editor (drag/zoom works)
- [ ] "Bild speichern" uploads successfully
- [ ] Closing modal (✕ or backdrop click) stops stream

**Step 3: Deploy:**
```bash
cd /home/tomblume/IdeaProjects/sharemember-app
docker build -t ghcr.io/share-community/sharemember-app:latest \
  -f /home/tomblume/IdeaProjects/u2g-infrastructure-ts/services/sharemember-app/Dockerfile .
docker save ghcr.io/share-community/sharemember-app:latest | \
  ssh -i ~/.ssh/scaleway_ed25519 root@51.15.211.196 docker load
ssh -i ~/.ssh/scaleway_ed25519 root@51.15.211.196 \
  "cd /opt/share-platform/infra && \
   docker compose -f docker-compose.prod.yml -p share-prod --env-file .env.prod up -d sharemember-app-prod && \
   docker restart coolify-proxy"
```

**Step 4: Verify:**
```bash
curl -sI https://id.wurzelwerk.up2go.com | head -2
```
Expected: `HTTP/2 200`

**Step 5: Final commit + push:**
```bash
cd /home/tomblume/IdeaProjects/sharemember-app && bd sync && git push
```
