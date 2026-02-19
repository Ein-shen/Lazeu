import { useEffect, useRef, useState } from 'react'
import { ChevronDown, User, Settings, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import Upperbar from './Upperbar'

const CACHE_KEY_PREFIX = 'accountProfile_'

export const Navbar = () => {
  const navigate = useNavigate()

  const [photoUrl, setPhotoUrl] = useState(null)
  const [showAccount, setShowAccount] = useState(false) // dropdown open/closed
  const menuRef = useRef(null)

  // load the avatar: cached first, then the latest from Supabase
  useEffect(() => {
    const loadPhoto = async (user) => {
      if (!user) {
        setPhotoUrl(null)
        return
      }

      try {
        const cached = localStorage.getItem(`${CACHE_KEY_PREFIX}${user.id}`)
        if (cached) setPhotoUrl(JSON.parse(cached).photoUrl || null)
      } catch {
        localStorage.removeItem(`${CACHE_KEY_PREFIX}${user.id}`)
      }

      const { data } = await supabase
        .from('profiles')
        .select('profiles_image')
        .eq('id', user.id)
        .single()

      const url = data?.profiles_image || null
      setPhotoUrl(url)
      localStorage.setItem(`${CACHE_KEY_PREFIX}${user.id}`, JSON.stringify({ photoUrl: url }))
    }

    supabase.auth.getUser().then(({ data: { user } }) => loadPhoto(user))

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      loadPhoto(session?.user ?? null)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  // update the avatar when the profile page uploads a new photo
  useEffect(() => {
    const onUpdate = (e) => setPhotoUrl(e.detail?.photoUrl || null)
    window.addEventListener('profile-updated', onUpdate)
    return () => window.removeEventListener('profile-updated', onUpdate)
  }, [])

  // close the dropdown when clicking outside or pressing Escape
  useEffect(() => {
    if (!showAccount) return

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowAccount(false)
      }
    }
    const handleEscape = (e) => {
      if (e.key === 'Escape') setShowAccount(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [showAccount])

  const goTo = (path) => {
    setShowAccount(false)
    navigate(path)
  }

  const handleLogout = async () => {
    setShowAccount(false)
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Logout error:', error)
      return
    }
    navigate('/login')
  }

  const menuItems = [
    { label: 'Profile', icon: User, onClick: () => goTo('/profile') },
    { label: 'Settings', icon: Settings, onClick: () => goTo('/settings') },
  ]

  return (
    <header className="fixed top-0 left-0 z-50 w-full nav-theme bg-gray-300">
      <div className="flex h-14 w-full items-center justify-between gap-2 pr-2 sm:pr-4">
        {/* Logo */}
        <div className="flex shrink-0 items-center pl-3 sm:pl-5 md:w-64 md:justify-center md:pl-0">
          <h1 className="font-bold text-xl sm:text-2xl text-gray-200 leading-none whitespace-nowrap">
            L<img src="/mortarboard.png" alt="" className="inline h-6 w-5 pb-1 sm:h-7 sm:w-6" />zeu
          </h1>
        </div>

        <div className="flex shrink-0 flex-row items-center gap-1 sm:gap-6">
          <Upperbar />

          {/* Profile + dropdown */}
          <div ref={menuRef} className="relative flex shrink-0 flex-row items-center gap-0.5 sm:gap-1">
            <div
              onClick={() => navigate('/profile')}
              className="h-8 w-8 sm:h-9 sm:w-9 cursor-pointer overflow-hidden rounded-full border border-black/80"
            >
              {photoUrl && (
                <img src={photoUrl} alt="Profile" className="h-full w-full object-cover" />
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowAccount((prev) => !prev)}
              aria-haspopup="menu"
              aria-expanded={showAccount}
              aria-label="Account menu"
              className="rounded-lg p-1 opacity-60 transition hover:opacity-100"
            >
              <ChevronDown
                size={20}
                className={`transition-transform duration-200 ${showAccount ? 'rotate-180' : ''}`}
              />
            </button>

            {showAccount && (
              <div
                role="menu"
                className="absolute right-0 top-full mt-2 w-48 sm:w-52 max-w-[calc(100vw-1rem)] overflow-hidden rounded-xl border border-black/80 card-theme shadow-lg"
              >
                {menuItems.map(({ label, icon: Icon, onClick }) => (
                  <button
                    key={label}
                    type="button"
                    role="menuitem"
                    onClick={onClick}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left border-b border-black/80 text-sm transition card-hover-theme"
                  >
                    <Icon size={16} className="opacity-70" />
                    {label}
                  </button>
                ))}

                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-red-600 transition card-hover-theme"
                >
                  <LogOut size={16} />
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}