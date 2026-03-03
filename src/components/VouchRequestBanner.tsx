import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthContext'
import { fetchPendingVouchRequests, type VouchRequest } from '../api/vouch'

export function VouchRequestBanner(): JSX.Element | null {
  const { user } = useAuth()
  const { t } = useTranslation()
  const [requests, setRequests] = useState<VouchRequest[]>([])

  useEffect(() => {
    if (!user || user.eidStatus !== 'identified') return
    fetchPendingVouchRequests(user.accessToken)
      .then(setRequests)
      .catch(() => {
        /* non-critical, fail silently */
      })
  }, [user])

  if (requests.length === 0) return null

  const first = requests[0]
  const count = requests.length

  return (
    <div className="vouch-banner">
      <span className="vouch-banner-icon">🤝</span>
      <span className="vouch-banner-text">
        {count === 1
          ? t('vouch.banner_single', { name: first.requestee.name })
          : t('vouch.banner_multiple', { count })}
      </span>
      <Link to={`/vouch/${first.id}`} className="vouch-banner-cta">
        {t('vouch.banner_cta')}
      </Link>
    </div>
  )
}
