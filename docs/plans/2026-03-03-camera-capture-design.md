# Camera Capture for Profile Picture — Design

**Date**: 2026-03-03
**Issue**: SM-6d6
**Status**: Approved

## Overview

Add camera capture as an alternative to file upload in the `ProfilePictureEditor` on the Settings page. Works on mobile (PWA, front/back flip) and desktop (getUserMedia, multi-camera). A circular crop overlay is shown live in the video preview so the user can see the framing before capturing.

## Architecture

### New Files

```
src/components/
├── ProfilePictureEditor.tsx   (existing — minimal changes)
├── CameraModal.tsx            (new)
└── useCamera.ts               (new, adapted from shaRe-profile-picture-editor example)
```

### Data Flow

```
ProfilePictureEditor
  ├── [Datei hochladen] → input type=file → handleFileChange (unchanged)
  └── [Foto aufnehmen]  → CameraModal (open=true)
                              └── useCamera (getUserMedia, flip, stop)
                                    └── <video> + SVG circle mask overlay
                                          └── [Aufnehmen] → capturePhoto()
                                                └── onCapture(dataURL)
                                                      └── loadImageFromUrl() → Canvas editor
```

## useCamera.ts

Adapted from the example project (`shaRe-profile-picture-editor/src/hooks/useCamera.ts`). Simplifications:
- No `CanvasConfig` dependency
- No `localStorage` camera preference persistence
- No `isEnumerating` state

### Public API

```typescript
{
  isCapturing: boolean
  stream: MediaStream | null
  facingMode: 'user' | 'environment'
  availableCameras: MediaDeviceInfo[]
  cameraError: { message: string; help: string } | null
  videoRef: RefObject<HTMLVideoElement>
  captureCanvasRef: RefObject<HTMLCanvasElement>
  startCamera: () => Promise<void>
  stopCamera: () => void
  capturePhoto: () => string        // returns dataURL, stops stream
  flipCamera: () => void            // mobile: front/back, desktop: cycle cameras
  clearError: () => void
}
```

### Error Types

Handle via i18n (German/English):
- `NotAllowedError` / `PermissionDeniedError` → Kamera-Zugriff verweigert
- `NotFoundError` / `DevicesNotFoundError` → Keine Kamera gefunden
- `NotReadableError` / `TrackStartError` → Kamera wird verwendet
- default → Kamera-Fehler

## CameraModal.tsx

Modal overlay (fullscreen fixed), centred panel.

### Layout

```
┌─────────────────────────────┐
│      Foto aufnehmen         │
│   ┌─────────────────────┐   │
│   │   <video>           │   │
│   │    ╭─────────╮      │   │  ← SVG circle mask (evenodd fill)
│   │    │  crop   │      │   │    outside circle: rgba(0,0,0,0.5)
│   │    ╰─────────╯      │   │
│   └─────────────────────┘   │
│  [↺ Flip] [● Aufnehmen] [✕] │
│  (error box if needed)      │
└─────────────────────────────┘
```

### SVG Mask

`<svg>` positioned absolute over `<video>`, full size, `pointer-events: none`.
Uses `fill-rule="evenodd"` path: outer rectangle minus inner circle = semi-transparent overlay outside the crop area.

### Button Visibility

- **Flip**: only shown when `availableCameras.length > 1` or mobile (detected via `navigator.userAgent`)
- **Capture**: disabled while `stream === null`
- **Loading spinner**: shown over video while `stream === null`

### Props

```typescript
interface CameraModalProps {
  onCapture: (dataURL: string) => void
  onClose: () => void
}
```

## ProfilePictureEditor Changes

Three additions only:

1. `const [cameraOpen, setCameraOpen] = useState(false)`
2. `loadImageFromUrl(dataURL: string)` — same logic as `handleFileChange` but from dataURL instead of File
3. Second button `[Foto aufnehmen]` in `avatar-editor-buttons`
4. `{cameraOpen && <CameraModal onCapture={...} onClose={...} />}` at JSX end

## i18n Keys

| Key | DE | EN |
|-----|----|----|
| `settings.picture_camera` | Foto aufnehmen | Take photo |
| `camera.title` | Foto aufnehmen | Take photo |
| `camera.capture` | Aufnehmen | Capture |
| `camera.flip` | Kamera wechseln | Flip camera |
| `camera.loading` | Kamera wird gestartet… | Starting camera… |
| `camera.error_permission` | Kamera-Zugriff verweigert. Bitte erlaube den Kamera-Zugriff in den Browser-Einstellungen. | Camera access denied. Please allow camera access in your browser settings. |
| `camera.error_not_found` | Keine Kamera gefunden. Bitte stelle sicher, dass eine Kamera angeschlossen ist. | No camera found. Please make sure a camera is connected. |
| `camera.error_in_use` | Kamera wird bereits verwendet. Schließe andere Apps und versuche es erneut. | Camera is in use. Close other apps and try again. |
| `camera.error_generic` | Kamera-Fehler. Bitte überprüfe die Berechtigungen und versuche es erneut. | Camera error. Please check permissions and try again. |

## CSS

New classes in `App.css`:
- `.camera-modal-overlay` — fullscreen fixed backdrop
- `.camera-modal` — centred card panel
- `.camera-video-wrapper` — relative container for video + SVG
- `.camera-svg-mask` — absolute positioned overlay SVG
- `.camera-buttons` — flex row for action buttons

Styling follows existing dark theme (`#031633` background, `cta-button` classes, `border-radius: 12px`).
