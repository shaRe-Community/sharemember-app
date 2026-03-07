import { useTranslation } from 'react-i18next'

interface MemberAvatarProps {
  name: string
  pictureUrl: string | null | undefined
  eidStatus: 'identified' | 'un_identified'
  /** 'large' = 80px (profile page), 'nav' = 32px (header). Default: 'large' */
  size?: 'large' | 'nav'
}

export function MemberAvatar({
  name,
  pictureUrl,
  eidStatus,
  size = 'large',
}: MemberAvatarProps): JSX.Element {
  const { t } = useTranslation()
  const isIdentified = eidStatus === 'identified'
  const initials = name
    ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  const wrapperClass = size === 'nav' ? 'nav-avatar-wrapper' : 'avatar-wrapper'
  const circleClass = size === 'nav' ? 'nav-avatar' : 'avatar'

  return (
    <div className={`${wrapperClass}${isIdentified ? '' : ' avatar-unidentified'}`}>
      <div className={circleClass}>
        {pictureUrl ? (
          <img src={pictureUrl} alt={name} className="avatar-img" />
        ) : (
          initials
        )}
      </div>
      <span
        className={`avatar-badge${isIdentified ? ' avatar-badge-shield' : ' avatar-badge-question'}`}
        title={isIdentified ? undefined : t('profile.identity_unverified')}
      >
        {isIdentified ? '✓' : '?'}
      </span>
    </div>
  )
}
