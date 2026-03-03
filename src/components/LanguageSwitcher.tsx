import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
]

export function LanguageSwitcher(): JSX.Element {
  const { i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleSelect = (code: string) => {
    void i18n.changeLanguage(code)
    setOpen(false)
  }

  const currentCode = i18n.language.startsWith('de') ? 'de' : 'en'

  return (
    <div className="lang-switcher" ref={ref}>
      <button
        className="lang-switcher-btn"
        onClick={() => setOpen(o => !o)}
        aria-label="Change language"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        {/* Globe SVG */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        <span>{currentCode.toUpperCase()}</span>
      </button>

      {open && (
        <ul className="lang-switcher-menu" role="listbox">
          {LANGUAGES.map(lang => {
            const isActive = currentCode === lang.code
            return (
              <li
                key={lang.code}
                role="option"
                aria-selected={isActive}
                className={`lang-switcher-item${isActive ? ' lang-switcher-item-active' : ''}`}
                onClick={() => handleSelect(lang.code)}
              >
                <span className="lang-switcher-check">
                  {isActive ? '✓' : ''}
                </span>
                {lang.label}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
