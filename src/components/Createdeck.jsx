import React, { useState } from 'react'
import { supabase } from '../supabaseClient'
import { X } from 'lucide-react'
import DeckDropDown from "../components/DeckDropDown"

const Createdeck = ({ deck = {}, onComplete, onCancel }) => {
    const [form, setForm] = useState({ deckname: deck.deckname ?? '' })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const isEditing = !!deck.id   // true if we were handed an existing deck, false if creating new

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            setError('Not logged in')
            setLoading(false)
            return
        }

        let result

        if (isEditing) {
            // updating an existing deck's name
            result = await supabase
                .from('decks')
                .update({ deckname: form.deckname })
                .eq('id', deck.id)
                .select()
        } else {
            // creating a brand new deck
            result = await supabase
                .from('decks')
                .insert([{ user_id: user.id, deckname: form.deckname, is_public: false }])
                .select()
        }

        const { data, error } = result

        if (error) {
            setError(error.message)
        } else {
            onComplete(data[0])
        }

        setLoading(false)
    }

    return (
        <div style={Deck_style.overlay} onClick={(e) => e.stopPropagation()}>
            <div style={Deck_style.modal}>

                <button
                    type="button"
                    style={Deck_style.X}
                    onClick={onCancel ?? onComplete}
                    aria-label="Close"
                >
                    <X size={24} />
                </button>

                <h1 className='font-bold flex flex-row items-center gap-1'>
                    <img
                        src="https://img.icons8.com/?size=100&id=DQ8rpgRkocmO&format=png&color=000000"
                        alt="add"
                        width={20}
                        height={20}
                    />
                    {isEditing ? 'Edit deck' : 'Add deck'}
                </h1>

                {error && <p style={{ color: 'red' }}>{error}</p>}

                <form onSubmit={handleSubmit}>
                    <input
                        style={Deck_style.input}
                        className='div-theme'
                        name="deckname"
                        placeholder="Name your deck"
                        value={form.deckname}
                        onChange={handleChange}
                        required
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className='div-theme card-hover-theme rounded-md px-4 py-2 font-semibold w-full'
                    >
                        {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Deck'}
                    </button>
                </form>
            </div>
        </div>
    )
}

const Deck_style = {
    overlay: {
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // black at 50% (same as bg-black/50)
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        zIndex: 1000,
    },
    modal: {
        position: 'relative',
        backgroundColor: '#ACC5A6',
        padding: '2rem',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '400px',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        border: '1px solid rgba(0, 0, 0, 0.8)',
    },
    input: {
        width: '100%',
        padding: '0.75rem',
        marginBottom: '0.75rem',
        borderRadius: '8px',
        border: '1px solid #ccc',
        fontSize: '1rem',
    },
    X: {
        position: 'absolute',
        top: '1rem',
        right: '1rem',
        cursor: 'pointer',
        background: 'none',
        border: 'none',
    },
}

export default Createdeck