import { useState, type FormEvent } from 'react'
import type { CardCreateInput } from '../types/card'
import { createCard } from '../services/cardApi'

type CardAdminPageProps = {
  onBack: () => void
}

const emptyForm: CardCreateInput = {
  title: '',
  description: '',
  category: 'program',
  status: 'active',
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
    }

    if (!payload.title || !payload.description || !payload.category || !payload.status) {
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
    <section className="admin-page">
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
