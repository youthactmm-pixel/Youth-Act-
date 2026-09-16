import { useState, type FormEvent } from 'react'
import type { CardCreateInput } from '../types/card'
import { createCard } from '../services/cardApi'

type CardAdminPageProps = {
  onBack: () => void
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

export default function CardAdminPage({ onBack }: CardAdminPageProps) {
  const [form, setForm] = useState<CardCreateInput>(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

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
      await createCard(payload)
      setForm(emptyForm)
      setMessage('Card created successfully.')
      onBack()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to create the card.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="admin-page fade-section">
      <div className="admin-page-top shell">
        <div>
          <p className="eyebrow">YouthAct Dashboard</p>
          <h1>Create a card</h1>
        </div>
        <button className="button button-dark" type="button" onClick={onBack}>
          Back to home <span>↗</span>
        </button>
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
              required
            />
          </label>

          <div className="form-actions">
            <button className="button button-dark" type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : 'Create card'} <span>↗</span>
            </button>
            {message && <span className="form-message">{message}</span>}
          </div>
        </form>
      </section>
    </section>
  )
}
