import { useEffect, useState, type FormEvent } from 'react'
import {
  createCard,
  fetchCards,
  updateCard,
  type CardCreateInput,
  type CardModel,
} from '../services/Api'

type CardAdminPageProps = {
  onBack: () => void
  onLogout: () => void
}

const emptyForm: CardCreateInput = {
  image: '',
  title: '',
  description: '',
  category: 'program',
  status: 'active',
}

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    const objectUrl = URL.createObjectURL(file)

    image.onload = () => {
      const maxDimension = 1600
      const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
      canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(objectUrl)
      resolve(canvas.toDataURL('image/jpeg', 0.8))
    }

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Unable to process the selected image.'))
    }

    image.src = objectUrl
  })
}

export default function CardAdminPage({ onBack, onLogout }: CardAdminPageProps) {
  const [form, setForm] = useState<CardCreateInput>(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [cards, setCards] = useState<CardModel[]>([])
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)

  const loadCards = async () => {
    try {
      const nextCards = await fetchCards()
      setCards(nextCards)
    } catch (error) {
      setCards([])
      console.error(error)
    }
  }

  useEffect(() => {
    loadCards()
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category.trim(),
      status: form.status.trim(),
      image: form.image,
    }

    if (!payload.title || !payload.description || !payload.category || !payload.status || !payload.image) {
      setMessage('Please complete every card field.')
      return
    }

    setSubmitting(true)
    setMessage('')

    try {
      if (selectedCardId) {
        await updateCard(selectedCardId, payload)
        setMessage('Card updated successfully.')
      } else {
        await createCard(payload)
        setMessage('Card created successfully.')
      }

      setForm(emptyForm)
      setSelectedCardId(null)
      await loadCards()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save the card.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleEdit(card: CardModel) {
    setSelectedCardId(card.id)
    setForm({
      image: card.image,
      title: card.title,
      description: card.description,
      category: card.category,
      status: card.status,
    })
    setMessage('Editing card: ' + card.title)
  }

  function handleNewCard() {
    setSelectedCardId(null)
    setForm(emptyForm)
    setMessage('')
  }

  return (
    <section className="admin-page fade-section">
      <div className="admin-page-top shell">
        <div>
          <p className="eyebrow">YouthAct Dashboard</p>
          <h1>{selectedCardId ? 'Edit card' : 'Create a card'}</h1>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button className="button button-dark" type="button" onClick={onBack}>
            Back to home <span>↗</span>
          </button>
          <button className="button button-dark" type="button" onClick={onLogout}>
            Logout <span>↗</span>
          </button>
        </div>
      </div>

      <section className="card-form-section shell">
        <form className="card-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label className="field">
              <span>Title</span>
              <input
                type="text"
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                placeholder="Card title"
                required
              />
            </label>

            <label className="field">
              <span>Category</span>
              <input
                type="text"
                value={form.category}
                onChange={(event) => setForm({ ...form, category: event.target.value })}
                placeholder="program"
                required
              />
            </label>

            <label className="field">
              <span>Status</span>
              <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                <option value="active">active</option>
                <option value="draft">draft</option>
                <option value="archived">archived</option>
              </select>
            </label>
          </div>

          <label className="field field-full">
            <span>Description</span>
            <textarea
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              placeholder="Card description"
              required
            />
          </label>

          <label className="field field-full">
            <span>Add Image</span>
            <input type="file"
              accept='image/*'
              onChange={(event) => {
                const file = event.target.files?.[0]

                if (!file) {
                  setForm({ ...form, image: '' })
                  return
                }

                if (file.size > 15 * 1024 * 1024) {
                  setForm({ ...form, image: '' })
                  setMessage('Please choose an image smaller than 15 MB.')
                  event.target.value = ''
                  return
                }

                setMessage('')
                compressImage(file)
                  .then((image) => setForm({ ...form, image }))
                  .catch((error) => setMessage(error instanceof Error ? error.message : 'Unable to process the selected image.'))
              }}
              placeholder="Add Image"
            />
          </label>

          <div className="form-actions">
            <button className="button button-dark" type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : selectedCardId ? 'Update card' : 'Create card'} <span>↗</span>
            </button>
            {selectedCardId && (
              <button className="button button-dark" type="button" onClick={handleNewCard}>
                Create new card
              </button>
            )}
            {message && <span className="form-message">{message}</span>}
          </div>
        </form>
      </section>

      <section className="card-form-section shell" style={{ marginTop: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0 }}>Existing cards</h2>
        </div>

        <div style={{ display: 'grid', gap: '12px' }}>
          {cards.length === 0 ? (
            <p>No cards found yet.</p>
          ) : (
            cards.map((card) => (
              <div key={card.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center', padding: '12px 16px', border: '1px solid #dfe7e5', borderRadius: '12px', background: 'rgba(255,255,255,0.6)' }}>
                <div>
                  <strong>{card.title}</strong>
                  <div style={{ fontSize: '0.9rem', color: '#4f5d5a' }}>{card.category} · {card.status}</div>
                </div>
                <button className="button button-dark" type="button" onClick={() => handleEdit(card)}>
                  Edit
                </button>
              </div>
            ))
          )}
        </div>
      </section>
    </section>
  )
}
