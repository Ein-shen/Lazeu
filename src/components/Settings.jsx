// src/pages/Settings.jsx
import { useState } from 'react'
import { ChevronRight, Mail, Heart, Star } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Return from '../components/Return'

// ===== EDIT THESE =====
const DEVELOPER_NAME = 'Shen Sarsale'
const DEVELOPER_EMAIL = 'email@lazeu.com'
const SUPPORT_PATH = ''   // e.g. '/support'. Leave empty until the page exists
// ======================

const RATING_KEY = 'lazeu_rating'

// action: 'contact' opens the email app, otherwise `path` is used.
// Rows with no path and no action do nothing when clicked.
const settingsItems = [
  {
    label: 'Help and support',
    path: '',   // e.g. '/support'
    icon: 'https://img.icons8.com/?size=100&id=30379&format=png&color=000000',
  },
  {
    label: 'Ask for help',
    action: 'contact',
    icon: 'https://img.icons8.com/?size=100&id=3I5w44gHhXXv&format=png&color=000000',
  },
  {
    label: 'About',
    path: '',   // e.g. '/about'
    icon: 'https://img.icons8.com/?size=100&id=3439&format=png&color=000000',
  },
]

// shared look for every tappable row
const rowClass =
  'flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-sm font-semibold ' +
  'border-b border-black/20 last:border-b-0 transition-colors card-hover-theme ' +
  'focus-visible:outline-none focus-visible:bg-[#bed8b7] sm:px-6 sm:py-4 sm:text-base'

// round tile that holds each row's icon
const iconTileClass =
  'inner-theme flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black/30 sm:h-10 sm:w-10'

export const Settings = () => {
  const navigate = useNavigate()

  // saved rating (0 = not rated yet)
  const [rating, setRating] = useState(() => {
    try {
      return Number(localStorage.getItem(RATING_KEY)) || 0
    } catch {
      return 0
    }
  })
  const [hover, setHover] = useState(0)

  const handleContact = () => {
    window.location.href = `mailto:${DEVELOPER_EMAIL}?subject=${encodeURIComponent('Lazeu help')}`
  }

  const handleRate = (value) => {
    setRating(value)
    try {
      localStorage.setItem(RATING_KEY, String(value))
    } catch {
      // ignore storage errors
    }
  }

  const goTo = (path) => {
    if (path && path.trim()) navigate(path.trim())
  }

  const handleItemClick = ({ action, path }) => {
    if (action === 'contact') handleContact()
    else goTo(path)
  }

  const shown = hover || rating

  return (
    // same page padding as Notification, no max-width so the cards match its width
    <div className="div-theme text-dark-theme flex min-h-screen w-full flex-col items-center px-4 pb-6 pt-6 sm:px-10 sm:pb-10 sm:pt-10 md:px-20">
      <div className="flex w-full flex-col gap-6 sm:gap-8">

        {/* Header (same as Notification) */}
        <div className="flex w-full flex-row items-center">
          <Return to="/" className="top-0" />
          <h1 className="flex flex-1 flex-row justify-center gap-2 pr-10 text-center text-base font-bold sm:pr-16 sm:text-lg">
            Settings
          </h1>
        </div>

        {/* Settings list */}
        <div className="card-theme flex w-full flex-col overflow-hidden rounded-2xl border border-black/80 shadow-sm">
          {settingsItems.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => handleItemClick(item)}
              className={rowClass}
            >
              <span className="flex min-w-0 flex-row items-center gap-3">
                <span className={iconTileClass}>
                  <img src={item.icon} alt="" width={20} height={20} className="object-contain" />
                </span>
                <span className="truncate">{item.label}</span>
              </span>
              <ChevronRight size={20} className="shrink-0 opacity-60" />
            </button>
          ))}

          {/* Contact developer */}
          <button type="button" onClick={handleContact} className={rowClass}>
            <span className="flex min-w-0 flex-row items-center gap-3">
              <span className={iconTileClass}>
                <Mail size={20} />
              </span>
              <span className="flex min-w-0 flex-col text-left">
                <span>Contact developer</span>
                <span className="truncate text-xs font-normal opacity-70">
                  {DEVELOPER_NAME} · {DEVELOPER_EMAIL}
                </span>
              </span>
            </span>
            <ChevronRight size={20} className="shrink-0 opacity-60" />
          </button>

          {/* Support Lazeu */}
          <button type="button" onClick={() => goTo(SUPPORT_PATH)} className={rowClass}>
            <span className="flex min-w-0 flex-row items-center gap-3">
              <span className={iconTileClass}>
                <Heart size={20} />
              </span>
              <span className="truncate">Support Lazeu</span>
            </span>
            <ChevronRight size={20} className="shrink-0 opacity-60" />
          </button>
        </div>

        {/* Rate Lazeu */}
        <div className="card-theme flex w-full flex-col items-center gap-3 rounded-2xl border border-black/80 px-4 py-5 text-center shadow-sm sm:flex-row sm:justify-between sm:px-6 sm:text-left">
          <span className="flex flex-row items-center gap-3 text-sm font-semibold sm:text-base">
            <span className={iconTileClass}>
              <Star size={20} />
            </span>
            <span className="flex flex-col leading-tight">
              <span>Rate Lazeu</span>
              <span className="text-xs font-normal opacity-70">
                {rating ? `You rated ${rating} of 5. Thank you!` : 'Tap a star to rate'}
              </span>
            </span>
          </span>

          <div
            className="flex flex-row items-center"
            onMouseLeave={() => setHover(0)}
          >
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                aria-label={`Rate ${value} star${value > 1 ? 's' : ''}`}
                onClick={() => handleRate(value)}
                onMouseEnter={() => setHover(value)}
                className="rounded-md p-1.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/50"
              >
                <Star
                  size={26}
                  className={`shrink-0 ${value <= shown ? 'text-yellow-500' : 'text-gray-500/70'}`}
                  fill={value <= shown ? 'currentColor' : 'none'}
                />
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

export default Settings