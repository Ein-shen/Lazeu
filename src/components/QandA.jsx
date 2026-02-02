import { useState, useEffect, useRef } from 'react'
import { supabase } from "../supabaseClient"
import { X, Upload } from 'lucide-react'

// Shared responsive class strings (mobile-first, scale up at sm:)
const fieldInput =
  "w-full min-h-[3rem] sm:min-h-[3.5rem] div-theme rounded-xl px-4 py-3 " +
  "text-base sm:text-lg border border-black/30 " +
  "focus:outline-none focus:ring-2 focus:ring-black/40"

const fieldLabel = "block px-1 pb-1.5 text-sm font-bold sm:text-base"

const actionBtn =
  "min-h-[3rem] w-full sm:w-auto sm:flex-1 rounded-full px-5 text-sm font-bold " +
  "border border-black/60 transition-colors disabled:opacity-60 sm:text-base"

const del = `${actionBtn} bg-red-400 hover:bg-red-200`
const save = `${actionBtn} bg-green-400 hover:bg-green-200`
const addChoiceBtn = `${actionBtn} bg-blue-400 hover:bg-blue-200`

// small heading used inside each card (Front / Back / Choices)
const sectionTitle =
  "flex flex-row items-center gap-2 px-1 text-base text-gray-600 sm:pl-2 sm:text-xl"

const emptyForm = { front: '', back: '', option1: '', option2: '', option3: '' }

const QandA = ({ deckId, onComplete, showForm, setShowForm, triggerAddNew }) => {

  const [choices, setChoices] = useState([])
  const [cardsList, setCardsList] = useState([])
  const scrollRef = useRef(null)
  const [editingId, setEditingId] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  // Fetch all cards for this deck
  useEffect(() => {
    if (!deckId) return

    const cached = localStorage.getItem(`cards_${deckId}`)
    if (cached && cached !== 'undefined') {
      try {
        setCardsList(JSON.parse(cached))
      } catch {
        localStorage.removeItem(`cards_${deckId}`)
      }
    }

    const fetchCards = async () => {
      const { data, error } = await supabase
        .from('cards')
        .select('id, front, back, option1, option2, option3, create_at, front_image_url')
        .eq('deck_id', deckId)
        .order('create_at', { ascending: false })

      if (!error && data) {
        setCardsList(data)
        localStorage.setItem(`cards_${deckId}`, JSON.stringify(data))

        data.forEach(c => {
          localStorage.setItem(`card_${c.id}`, JSON.stringify(c))
        })
        const ids = data.map(c => c.id)
        localStorage.setItem(`cardIds_${deckId}`, JSON.stringify(ids))
      }
    }

    fetchCards()
  }, [deckId])

  // Restore scroll position
  useEffect(() => {
    if (cardsList.length === 0) return
    const scroll = localStorage.getItem('deckScroll')
    if (scroll && scrollRef.current) {
      scrollRef.current.scrollTop = parseInt(scroll)
      localStorage.removeItem('deckScroll')
    }
  }, [cardsList])

  useEffect(() => {
    if (triggerAddNew) {
      handleAddNew()
    }
  }, [triggerAddNew])

  const [formCard, setFormCard] = useState(emptyForm)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormCard({ ...formCard, [e.target.name]: e.target.value })
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    let frontImageUrl = editingId
      ? cardsList.find((c) => c.id === editingId)?.front_image_url ?? null
      : null

    // user removed the preview while editing -> clear the image
    if (editingId && !imagePreview && !imageFile) frontImageUrl = null

    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop()
      const fileName = `${deckId}-${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('card-image')
        .upload(fileName, imageFile)

      if (uploadError) {
        setError(uploadError.message)
        setLoading(false)
        return
      }

      const { data: publicUrlData } = supabase.storage
        .from('card-image')
        .getPublicUrl(fileName)

      frontImageUrl = publicUrlData.publicUrl
    }

    const payload = editingId
      ? { id: editingId, deck_id: deckId, ...formCard, front_image_url: frontImageUrl }
      : { deck_id: deckId, ...formCard, front_image_url: frontImageUrl }

    const { data, error } = await supabase
      .from('cards')
      .upsert([payload], { onConflict: 'id' })
      .select()

    if (error) {
      setError(error.message)
    } else {
      if (data && data[0]) {
        setCardsList((prev) => {
          const exists = prev.some((c) => c.id === data[0].id)
          return exists
            ? prev.map((c) => (c.id === data[0].id ? data[0] : c))
            : [data[0], ...prev]
        })
      }

      setFormCard(emptyForm)
      setImageFile(null)
      setImagePreview(null)
      setChoices([])
      setEditingId(null)
      setShowForm(false)
      if (onComplete) onComplete()
    }

    setLoading(false)
  }

  const handleDelete = async (cardId) => {
    const { error } = await supabase.from('cards').delete().eq('id', cardId)

    if (!error) {
      setCardsList((prev) => prev.filter((c) => c.id !== cardId))
    } else {
      setError(error.message)
    }
  }

  const handleEdit = (c) => {
    setEditingId(c.id)
    setFormCard({
      front: c.front,
      back: c.back,
      option1: c.option1 ?? '',
      option2: c.option2 ?? '',
      option3: c.option3 ?? '',
    })
    setImagePreview(c.front_image_url ?? null)
    setImageFile(null)
    const filledOptions = [c.option1, c.option2, c.option3].filter(Boolean)
    setChoices(filledOptions.map(() => ''))
    setShowForm(true)
  }

  const handleAddNew = () => {
    setEditingId(null)
    setFormCard(emptyForm)
    setImageFile(null)
    setImagePreview(null)
    setChoices([])
    setShowForm(true)
  }

  const addChoice = () => {
    if (choices.length >= 3) return
    setChoices([...choices, ''])
  }

  return (
    <div
      ref={scrollRef}
      className="mx-auto mt-3 flex w-full max-w-3xl flex-col items-center px-3 pb-6 sm:mt-5 sm:px-4"
    >
      {showForm ? (
        <>
          {/* Form card */}
          <div className="card-theme flex w-full flex-col rounded-2xl border border-black/80">
            <button
              type="button"
              aria-label="Close form"
              onClick={() => { setShowForm(false); setEditingId(null) }}
              className="m-2 self-end rounded-lg p-2 transition-colors hover:bg-black/10 sm:mr-4 sm:mt-3"
            >
              <X size={24} />
            </button>

            <form
              id="card-form"
              onSubmit={handleSubmit}
              className="flex w-full flex-col gap-4 px-4 pb-6 pt-1 sm:gap-5 sm:px-8 sm:pb-8"
            >
              {/* Front */}
              <div className="w-full">
                <label htmlFor="front" className={fieldLabel}>Front</label>

                <div className="flex flex-col gap-3">
                  {imagePreview && (
                    <div className="relative ml-1 mt-1 h-20 w-20 self-start sm:h-24 sm:w-24">
                      <img
                        src={imagePreview}
                        alt="preview"
                        className="h-full w-full rounded-md object-cover"
                      />
                      <button
                        type="button"
                        aria-label="Remove image"
                        onClick={() => {
                          setImageFile(null)
                          setImagePreview(null)
                        }}
                        className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border border-black/80 bg-white text-black"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}

                  <div className="relative w-full">
                    <input
                      id="front"
                      className={`${fieldInput} pr-14`}
                      placeholder="Add Question"
                      name="front"
                      value={formCard.front}
                      onChange={handleChange}
                      required
                    />

                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      id="frontImageInput"
                      className="hidden"
                    />

                    <label
                      htmlFor="frontImageInput"
                      aria-label="Upload image"
                      className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded-lg p-2 transition-colors hover:bg-black/10"
                    >
                      <Upload size={20} />
                    </label>
                  </div>
                </div>
              </div>

              <hr className="w-full border-black/40" />

              {/* Back */}
              <div className="w-full">
                <label htmlFor="back" className={fieldLabel}>Back</label>
                <input
                  id="back"
                  className={fieldInput}
                  name="back"
                  placeholder="Add Answer"
                  value={formCard.back}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Options */}
              {choices.map((_, index) => {
                const fieldName = `option${index + 1}`
                return (
                  <div key={index} className="w-full">
                    <label htmlFor={fieldName} className={fieldLabel}>Option {index + 1}</label>
                    <input
                      id={fieldName}
                      name={fieldName}
                      className={fieldInput}
                      placeholder="Add choices"
                      value={formCard[fieldName]}
                      onChange={handleChange}
                      required
                    />
                  </div>
                )
              })}

              {error && (
                <p className="w-full break-words text-sm font-bold text-red-600 sm:text-base">
                  {error}
                </p>
              )}
            </form>
          </div>

          {/* Action bar: stacked on mobile, row on sm+ */}
          <div className="card-theme mt-3 w-full rounded-2xl border border-black/80 px-3 py-3 sm:px-8 sm:py-4">
            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap">
              {choices.length > 0 && (
                <button
                  type="button"
                  className={del}
                  onClick={() => setChoices(choices.slice(0, -1))}
                >
                  Delete choice
                </button>
              )}

              {choices.length < 3 && (
                <button type="button" className={addChoiceBtn} onClick={addChoice}>
                  Add choices
                </button>
              )}

              <button
                className={save}
                type="submit"
                form="card-form"
                disabled={loading}
              >
                {loading ? 'Saving...' : editingId ? 'Save Changes' : 'Save'}
              </button>
            </div>
          </div>
        </>

      ) : cardsList.length > 0 ? (
        <div className="flex w-full flex-col gap-4">
          {cardsList.map((c) => (
            <div
              key={c.id}
              className="card-theme flex min-w-0 flex-col gap-2 rounded-2xl border border-black/80 p-4 sm:p-6"
            >
              <h2 className={`${sectionTitle} pb-1 sm:pb-2`}>
                <img
                  src="https://img.icons8.com/?size=100&id=44353&format=png&color=000000"
                  alt=""
                  className="h-6 w-6 sm:h-7 sm:w-7"
                />
                Front
              </h2>

              {c.front_image_url && (
                <img
                  src={c.front_image_url}
                  alt="front"
                  className="ml-1 h-24 w-24 max-w-full rounded-md object-cover sm:ml-5 sm:h-32 sm:w-32"
                />
              )}

              <p className="break-words border-b border-black/30 px-1 pb-4 pt-2 text-base font-bold sm:pb-5 sm:pl-5 sm:text-lg">
                {c.front}
              </p>

              <h2 className={`${sectionTitle} pt-2 sm:pt-4`}>
                <img
                  src="https://img.icons8.com/?size=100&id=22188&format=png&color=000000"
                  alt=""
                  className="h-6 w-6 sm:h-7 sm:w-7"
                />
                Back
              </h2>
              <p className="break-words border-b border-black/30 px-1 pb-4 pt-2 text-base font-bold sm:pb-5 sm:pl-5 sm:text-lg">
                {c.back}
              </p>

              {(c.option1 || c.option2 || c.option3) && (
                <div className="flex flex-col gap-2 border-b border-black/30 pb-4 pt-2 sm:pb-5 sm:pt-4">
                  <h2 className={sectionTitle}>
                    <img
                      src="https://img.icons8.com/?size=100&id=WymyiG7EB0Qq&format=png&color=000000"
                      alt=""
                      className="h-6 w-6 sm:h-7 sm:w-7"
                    />
                    Choices
                  </h2>
                  {[c.option1, c.option2, c.option3].filter(Boolean).map((opt, i) => (
                    <span key={i} className="break-words px-1 text-base font-bold sm:pl-5 sm:text-lg">
                      - {opt}
                    </span>
                  ))}
                </div>
              )}

              {/* Buttons share the row on phones, sit at the right from sm up */}
              <div className="mt-3 flex flex-row gap-2 sm:mt-5 sm:justify-end sm:gap-3">
                <button
                  type="button"
                  onClick={() => handleEdit(c)}
                  className="div-theme card-hover-theme flex flex-1 flex-row items-center justify-center gap-2 rounded-lg border border-black/30 px-4 py-2.5 text-xs font-bold transition-colors sm:flex-none sm:text-sm"
                >
                  <img
                    src="https://img.icons8.com/?size=100&id=dGDK6sDzQfsa&format=png&color=000000"
                    alt=""
                    className="h-5 w-5 sm:h-6 sm:w-6"
                  />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(c.id)}
                  className="div-theme card-hover-theme flex flex-1 flex-row items-center justify-center gap-2 rounded-lg border border-black/30 px-4 py-2.5 text-xs font-bold transition-colors sm:flex-none sm:text-sm"
                >
                  <img
                    src="https://img.icons8.com/?size=100&id=A6KpvyL1Ezlb&format=png&color=000000"
                    alt=""
                    className="h-5 w-5 sm:h-6 sm:w-6"
                  />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex w-full flex-col items-center justify-center gap-4 px-4 py-16 text-center sm:py-32">
          <h1 className="text-lg font-bold sm:text-xl">No Activity yet</h1>
          <p className="text-sm sm:text-base">Add your activity to start study.</p>

          <button
            type="button"
            className="card-theme card-hover-theme flex w-full max-w-xs flex-row items-center justify-center gap-3 rounded-lg border border-black/60 px-6 py-2.5 text-xs font-bold sm:w-fit sm:text-sm"
            onClick={handleAddNew}
          >
            <img
              src="https://img.icons8.com/?size=100&id=DQ8rpgRkocmO&format=png&color=000000"
              alt=""
              width={24}
              height={24}
            />
            Add cards
          </button>
        </div>
      )}
    </div>
  )
}

export default QandA