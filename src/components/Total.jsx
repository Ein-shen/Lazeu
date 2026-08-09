// src/pages/Total.jsx
import { useNavigate, useParams } from 'react'
import { supabase } from '../supabaseClient'
import { useEffect, useState } from 'react'

const Total = () => {
  const navigate = useNavigate()
  const { deckId } = useParams()
  const [deck, setDeck] = useState(null)
  const [result, setResult] = useState(null)

  useEffect(() => {
    if (!deckId) return

    const fetchDeck = async () => {
      const cached = localStorage.getItem(`decks_${deckId}`)
      if (cached) {
        setDeck(JSON.parse(cached))
        return
      }

      const { data, error } = await supabase
        .from('decks')
        .select('deckname')
        .eq('id', deckId)
        .single()

      if (!error && data) {
        setDeck(data)
        localStorage.setItem(`decks_${deckId}`, JSON.stringify(data))
      } else if (error) {
        console.error('Error fetching deck:', error)
      }
    }

    fetchDeck()
  }, [deckId])

  // Fetch the latest quiz attempt for this deck
  useEffect(() => {
    if (!deckId) return

    const fetchLatestAttempt = async () => {
      const { data: userData } = await supabase.auth.getUser()
      const user = userData?.user
      if (!user) return

      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('deck_id', deckId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (!error && data) {
        setResult(data)
      } else if (error) {
        console.error('Error fetching latest attempt:', error)
      }
    }

    fetchLatestAttempt()
  }, [deckId])

  return (
    <div className="w-full min-h-screen div-theme flex flex-col items-center justify-start sm:justify-center py-8 px-4 sm:px-6">
      <div className="w-full max-w-xl card-theme rounded-md flex flex-col items-center justify-between gap-6 px-4 sm:px-8 py-8 sm:py-12 shadow-sm min-h-[60vh]">

        {/* Deck Title Header */}
        <h1 className="font-bold text-lg sm:text-2xl md:text-3xl text-center break-words flex items-center justify-center gap-2">
          <img
            src="/mortarboard.png"
            alt="mortarboard"
            className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 shrink-0 object-contain"
          />
          <span>{deck?.deckname}</span>
        </h1>

        {/* Result Display */}
        <div className="flex flex-col items-center justify-center my-auto py-4">
          <h2 className="font-semibold text-lg sm:text-xl md:text-2xl text-center text-gray-700 dark:text-gray-200">
            Your result:
          </h2>
          <p className="font-extrabold text-3xl sm:text-5xl md:text-6xl text-center pt-3 tracking-tight">
            {result ? `${result.score} / ${result.total_questions}` : 'Loading...'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center pt-4">
          <button
            type="button"
            className="font-bold text-sm sm:text-base card-hover-theme div-theme rounded-md h-12 w-full sm:w-36 transition duration-150 flex items-center justify-center"
            onClick={() => navigate(`/cards/${deckId}`)}
          >
            Back
          </button>

          <button
            type="button"
            className="font-bold text-sm sm:text-base card-hover-theme div-theme rounded-md h-12 w-full sm:w-36 transition duration-150 flex items-center justify-center"
            onClick={() => navigate(`/study/${deckId}`)}
          >
            Re-study
          </button>
        </div>

      </div>
    </div>
  )
}

export default Total