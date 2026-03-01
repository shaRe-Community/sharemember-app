import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthContext'
import { AppShell } from '../components/AppShell'
import {
  getAccountInfo,
  updateAccountInfo,
  changePassword,
  type KcUserInfo,
} from '../api/keycloak-account'
import { ApiError } from '../api/api'
import { ProfilePictureEditor } from '../components/ProfilePictureEditor'

export function SettingsPage(): JSX.Element {
  const { user } = useAuth()
  const { t } = useTranslation()

  return (
    <AppShell>
      <div className="settings-container">
        <h1 className="settings-title">{t('settings.title')}</h1>
        <ProfilePictureSection token={user!.accessToken} currentPicture={user!.picture} />
        <PersonalInfoSection token={user!.accessToken} />
        <PasswordSection token={user!.accessToken} />
      </div>
    </AppShell>
  )
}

function PersonalInfoSection({ token }: { token: string }): JSX.Element {
  const { t } = useTranslation()
  const [form, setForm] = useState<KcUserInfo>({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getAccountInfo(token)
      .then((info) => setForm(info))
      .catch(() => setError(t('settings.error_generic')))
      .finally(() => setIsLoading(false))
  }, [token])

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setIsSaving(true)
    setSuccess(false)
    setError(null)
    try {
      await updateAccountInfo(token, form)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof ApiError && err.status === 401
        ? t('settings.error_401')
        : t('settings.error_generic'))
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return <div className="settings-card"><p>{t('nav.loading')}</p></div>

  return (
    <div className="settings-card">
      <h2 className="settings-section-title">{t('settings.personal_info_title')}</h2>
      <form onSubmit={(e) => void handleSubmit(e)}>
        <div className="settings-row">
          <div className="form-field">
            <label className="form-label">{t('settings.first_name')}</label>
            <input
              className="form-input"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              required
            />
          </div>
          <div className="form-field">
            <label className="form-label">{t('settings.last_name')}</label>
            <input
              className="form-input"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              required
            />
          </div>
        </div>
        <div className="form-field">
          <label className="form-label">{t('settings.email')}</label>
          <input
            className="form-input"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>
        {error && <p className="form-error">{error}</p>}
        {success && <p className="form-success">{t('settings.save_success')}</p>}
        <button type="submit" className="cta-button" disabled={isSaving}>
          {isSaving ? t('settings.saving') : t('settings.save')}
        </button>
      </form>
    </div>
  )
}

function ProfilePictureSection({ token, currentPicture }: { token: string; currentPicture: string | null }): JSX.Element {
  const { t } = useTranslation()
  const [isUploading, setIsUploading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(currentPicture)
  const localPreviewRef = useRef<string | null>(null)

  const ssoUrl = import.meta.env.VITE_SSO_URL as string
  const realm = import.meta.env.VITE_KEYCLOAK_REALM as string

  const handleUpload = async (blob: Blob): Promise<void> => {
    if (blob.size > 5 * 1024 * 1024) {
      setError(t('settings.picture_size_error'))
      return
    }

    setIsUploading(true)
    setSuccess(false)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', blob, 'profile.png')

      const res = await fetch(`${ssoUrl}/realms/${realm}/profile_pictures`, {
        method: 'POST',
        body: formData,
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      if (localPreviewRef.current) URL.revokeObjectURL(localPreviewRef.current)
      const url = URL.createObjectURL(blob)
      localPreviewRef.current = url
      setLocalPreviewUrl(url)
      setSuccess(true)
    } catch {
      setError(t('settings.picture_error'))
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="settings-card">
      <h2 className="settings-section-title">{t('settings.picture_title')}</h2>
      <ProfilePictureEditor
        currentPicture={localPreviewUrl}
        onUpload={handleUpload}
        isUploading={isUploading}
      />
      {error && <p className="form-error" style={{ marginTop: '1rem' }}>{error}</p>}
      {success && <p className="form-success" style={{ marginTop: '1rem' }}>{t('settings.picture_success')}</p>}
    </div>
  )
}

function PasswordSection({ token }: { token: string }): JSX.Element {
  const { t } = useTranslation()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setError(t('settings.password_mismatch'))
      return
    }
    setIsSaving(true)
    setSuccess(false)
    setError(null)
    try {
      await changePassword(token, currentPassword, newPassword)
      setSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(err instanceof ApiError && err.status === 401
        ? t('settings.error_401')
        : t('settings.error_generic'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="settings-card">
      <h2 className="settings-section-title">{t('settings.password_title')}</h2>
      <form onSubmit={(e) => void handleSubmit(e)}>
        <div className="form-field">
          <label className="form-label">{t('settings.current_password')}</label>
          <input
            className="form-input"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
        <div className="form-field">
          <label className="form-label">{t('settings.new_password')}</label>
          <input
            className="form-input"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            required
            minLength={8}
          />
        </div>
        <div className="form-field">
          <label className="form-label">{t('settings.confirm_password')}</label>
          <input
            className="form-input"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
        </div>
        {error && <p className="form-error">{error}</p>}
        {success && <p className="form-success">{t('settings.password_success')}</p>}
        <button type="submit" className="cta-button" disabled={isSaving}>
          {isSaving ? t('settings.changing_password') : t('settings.change_password')}
        </button>
      </form>
    </div>
  )
}
