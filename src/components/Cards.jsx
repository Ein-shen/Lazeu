import { useParams, useNavigate } from 'react-router-dom'
import Return from "../components/Return"
import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import QandA from "../components/QandA"

const Cards = () => {
  const { deckId } = useParams()
  const [deck, setDeck] = useState(null)
  const navigate = useNavigate()
  const [showForm, setShowForm] = useState(false)
  const [cards, setCards] = useState([])
  const [addNewTrigger, setAddNewTrigger] = useState(0)

  // ---- fetch deck info (local first, then refresh) ----
  useEffect(() => {
    if (!deckId) return

    let cancelled = false
    const cacheKey = `decks_${deckId}`

    // reset so a previous deck's name never flashes
    setDeck(null)

    const cached = localStorage.getItem(cacheKey)
    if (cached && cached !== 'undefined') {
      try {
        setDeck(JSON.parse(cached))
      } catch {
        localStorage.removeItem(cacheKey)
      }
    }

    const fetchDeck = async () => {
      const { data, error } = await supabase
        .from('decks')
        .select('deckname')
        .eq('id', deckId)
        .single()

      if (cancelled) return

      if (!error && data) {
        setDeck(data)
        localStorage.setItem(cacheKey, JSON.stringify(data))
      }
    }

    fetchDeck()
    return () => { cancelled = true }
  }, [deckId])

  // ---- fetch cards (standalone so QandA can call it via onComplete) ----
  const fetchCards = async () => {
    const { data, error } = await supabase
      .from('cards')
      .select('id, front, back, option1, option2, option3, create_at, front_image_url')
      .eq('deck_id', deckId)
      .order('create_at', { ascending: false })

    if (!error && data) {
      setCards(data)
      localStorage.setItem(`cards_${deckId}`, JSON.stringify(data))
    } else if (error) {
      console.error("Error fetching cards:", error)
    }
  }

  // ---- load cached cards instantly, then fetch fresh ----
  useEffect(() => {
    if (!deckId) return

    setCards([])

    const cacheKey = `cards_${deckId}`
    const cached = localStorage.getItem(cacheKey)
    if (cached && cached !== 'undefined') {
      try {
        setCards(JSON.parse(cached))
      } catch {
        localStorage.removeItem(cacheKey)
      }
    }

    fetchCards()
  }, [deckId])

  return (
    <>
      {/* Header */}
      <div className="mx-auto w-full max-w-3xl px-3 py-5 sm:px-4 sm:py-8">
        {/* back | centered title | spacer */}
        <div className="grid grid-cols-[2.5rem_1fr_2.5rem] items-center">
          <div className="flex items-center">
            <Return to="/decks" />
          </div>
          <h1 className="truncate text-center text-lg font-bold capitalize sm:text-xl">
            {deck?.deckname}
          </h1>
          <div />
        </div>

        {/* buttons share the row on phones, hug their content from sm up */}
        <div className="mt-5 flex flex-row gap-2 sm:mt-8 sm:gap-3">
          <button
            className="card-hover-theme card-theme flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none sm:px-6"
            onClick={() => navigate(`/study/${deckId}`)}
            disabled={cards.length === 0}
          >
            <img
              src="https://img.icons8.com/?size=100&id=MmkqIRv7P6Xy&format=png&color=000000"
              alt="study"
              width={24}
              height={24}
            />
            Start study
          </button>

          <button
            className="card-hover-theme card-theme flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold sm:flex-none sm:px-6"
            onClick={() => setAddNewTrigger((n) => n + 1)}
          >
            <img
              src="https://img.icons8.com/?size=100&id=DQ8rpgRkocmO&format=png&color=000000"
              alt="add"
              width={24}
              height={24}
            />
            Add cards
          </button>
        </div>
      </div>

      <div>
        <QandA
          deckId={deckId}
          showForm={showForm}
          setShowForm={setShowForm}
          onComplete={fetchCards}
          triggerAddNew={addNewTrigger}
        />
      </div>
    </>
  )
}

export default Cards