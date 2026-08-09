// src/pages/Stalk.jsx
import { useEffect, useState } from 'react'
import { useParams } from 'react'
import { supabase } from '../supabaseClient'
import ProfileCard from '../profile/ProfileCard'

const Stalk = () => {
  const { username } = useParams()
  const [profile, setProfile] = useState(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, fullname, username, profiles_image')
        .eq('username', username)
        .single()

      if (error || !data) {
        setNotFound(true)
      } else {
        setProfile(data)
      }
    }

    fetchProfile()
  }, [username])

  if (notFound) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-4">
        <p className="text-center text-lg font-medium text-gray-700">User not found.</p>
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="w-full min-h-screen bg-gray-300 flex flex-col items-center justify-start p-4 sm:p-6 md:p-8 box-border">
      <div className="w-full max-w-xl">
        <ProfileCard user={profile} profile={profile} />
      </div>
    </div>
  )
}

export default Stalk