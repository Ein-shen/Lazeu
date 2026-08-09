// src/pages/Study.jsx
import { useNavigate, useParams } from 'react'
import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../supabaseClient'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const Study = () => {
  const navigate = useNavigate()
  const { deckId } = useParams()
  const [deck, setDeck] = useState(null)
  const [cards, setCards] = useState([])
  const [index, setIndex] = useState(0)
  const [options, setOptions] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)

  // Save the score when the quiz is finished, then go to the results page
  useEffect(() => {
    if (!finished) return

    const saveScore = async () => {
      const { data: userData } = await supabase.auth.getUser()
      const user = userData?.user

      if (!user) {
        console.error('No logged in user, cannot save score.')
        navigate(`/total/${deckId}`)
        return
      }

      const { error } = await supabase.from('quiz_attempts').insert([
        {
          user_id: user.id,
          deck_id: deckId,
          score: score,
          total_questions: cards.length,
        },
      ])

      if (error) console.error('Error saving score:', error)

      navigate(`/total/${deckId}`)
    }

    saveScore()
  }, [finished, deckId, score, cards.length, navigate])

  // Fetch the cards
  useEffect(() => {
    async function fetchCards() {
      const startTime = Date.now()
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .eq('deck_id', deckId)

      if (error) console.error('Error fetching cards:', error)
      else setCards(data || [])

      const remaining = 1000 - (Date.now() - startTime)

      if (remaining > 0) {
        setTimeout(() => setLoading(false), remaining)
      } else {
        setLoading(false)
      }
    }

    fetchCards()
  }, [deckId])

  const card = cards[index]

  useEffect(() => {
    if (card) {
      const wrongAnswers = [card.option1, card.option2, card.option3].filter(Boolean)
      setOptions(shuffle([card.back, ...wrongAnswers]))
      setSelected(null)
    }
  }, [card])

  // Fetch the deck name
  useEffect(() => {
    async function fetchDeck() {
      const { data, error } = await supabase
        .from('decks')
        .select('*')
        .eq('id', deckId)
        .single()

      if (error) console.error('Error fetching deck:', error)
      else setDeck(data)
    }

    fetchDeck()
  }, [deckId])

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen w-full div-theme flex items-center justify-center p-4">
        <p className="text-lg sm:text-2xl md:text-3xl font-bold flex flex-col sm:flex-row items-center gap-3 text-center">
          <img src="/mortarboard.png" alt="mortarboard" className="w-16 sm:w-24 md:w-28 h-auto" />
          Please wait...
        </p>
      </div>
    )
  }

  if (!cards.length) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-6">
        <p className="text-center font-medium text-lg">No cards in this deck yet.</p>
      </div>
    )
  }

  function handleNext() {
    if (index + 1 < cards.length) {
      setIndex((i) => i + 1)
    } else {
      setFinished(true)
    }
  }

  function handleAnswer(opt) {
    setSelected(opt)
    if (opt === card.back) {
      setScore((s) => s + 1)
    }
  }

  return (
    <div className="min-h-screen w-full div-theme flex flex-col items-center justify-start gap-4 sm:gap-6 pt-4 sm:pt-8 pb-8 px-4 sm:px-6">

      {/* Header */}
      <div className="rounded-md card-theme w-full max-w-3xl flex items-center justify-between gap-2 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4 shadow-sm">
        <button
          type="button"
          aria-label="Close"
          className="flex-shrink-0 p-1 rounded-full hover:bg-gray-100/20 transition-colors"
          onClick={() => navigate(`/cards/${deckId}`)}
        >
          <X size={24} className="sm:w-7 sm:h-7" color="currentColor" />
        </button>

        <h1 className="flex-1 min-w-0 text-sm sm:text-lg md:text-xl font-bold text-center truncate flex items-center justify-center gap-1.5 sm:gap-2">
          <img src="/mortarboard.png" alt="mortarboard" className="w-5 h-5 sm:w-7 sm:h-7 shrink-0 object-contain" />
          <span className="truncate">{deck?.deckname}</span>
        </h1>

        <div className="flex-shrink-0 flex flex-col items-end text-right">
          <p className="font-bold text-xs sm:text-sm md:text-base whitespace-nowrap">
            Card: {index + 1} / {cards.length}
          </p>
          <p className="font-bold text-xs sm:text-sm md:text-base whitespace-nowrap">
            Score: {score}
          </p>
        </div>
      </div>

      {/* Main Container */}
      <form className="w-full max-w-3xl flex flex-col gap-4 sm:gap-6 pt-2 sm:pt-4">

        {/* Question card */}
        <div className="w-full card-theme rounded-md flex flex-col items-center justify-center gap-4 min-h-[180px] sm:min-h-[240px] p-5 sm:p-8 shadow-sm">
          {card.front_image_url && (
            <img
              src={card.front_image_url}
              alt="front"
              className="w-full max-w-[14rem] sm:max-w-xs md:max-w-sm h-auto max-h-48 sm:max-h-64 object-cover rounded-md"
            />
          )}

          <h1 className="text-base sm:text-xl md:text-2xl font-bold text-center break-words max-w-full">
            {card.front}
          </h1>

          {selected ? (
            <h1 className="flex flex-wrap items-center justify-center gap-2 font-bold text-xl sm:text-2xl md:text-3xl text-center break-words text-green-600 capitalize">
              <span>{card.back}</span>
              <img
                src="https://img.icons8.com/?size=100&id=sz8cPVwzLrMP&format=png&color=000000"
                alt="correct"
                className="w-7 h-7 sm:w-9 sm:h-9 object-contain"
              />
            </h1>
          ) : (
            <h1 className="font-bold text-lg sm:text-xl tracking-widest text-gray-500">_ _ _ _</h1>
          )}
        </div>

        {/* Answer choices */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {options.map((opt) => {
            const isPicked = selected === opt
            const isCorrect = opt === card.back

            let color = 'bg-[#8BBB92] hover:bg-[#a3cdaa]'
            if (selected) {
              if (isCorrect) color = 'bg-green-300 text-green-900 font-bold'
              else if (isPicked) color = 'bg-red-300 text-red-900 font-bold'
              else color = 'bg-[#8BBB92] opacity-50'
            }

            return (
              <button
                type="button"
                key={opt}
                disabled={selected !== null}
                onClick={() => handleAnswer(opt)}
                className={`w-full min-h-[3rem] sm:min-h-[3.5rem] md:min-h-[4rem] capitalize rounded-md px-3 sm:px-4 py-2 text-center font-bold text-xs sm:text-sm md:text-base break-words transition duration-150 flex items-center justify-center ${color}`}
              >
                {opt}
              </button>
            )
          })}
        </div>

        {/* Next button */}
        <button
          type="button"
          onClick={handleNext}
          disabled={!selected}
          tabIndex={selected ? 0 : -1}
          className={`w-full py-3.5 px-6 card-theme card-hover-theme rounded-md font-bold text-sm sm:text-base transition duration-150 ${
            selected ? 'opacity-100 cursor-pointer' : 'invisible pointer-events-none'
          }`}
        >
          Next
        </button>
      </form>
    </div>
  )
}

export default Study