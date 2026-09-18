import { useState, type FormEvent } from 'react'
import { createTown } from '../services/Api'

type CreateTownPageProps = {
  onBack: () => void
}

export default function CreateTownPage({ onBack }: CreateTownPageProps) {
  const [town, setTown] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const townName = town.trim()

    if (!townName) {
      setMessage('Please enter a town name.')
      return
    }

    setSubmitting(true)
    setMessage('')

    try {
      await createTown(townName)
      setTown('')
      setMessage('Town created successfully.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to create the town.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="admin-page fade-section">
      <div className="admin-page-top shell">
        <div>
          <p className="eyebrow">YouthAct Dashboard</p>
          <h1>Create a town</h1>
        </div>
        <button className="button button-dark" type="button" onClick={onBack}>
          Back to home <span>↗</span>
        </button>
      </div>

      <section className="card-form-section shell">
        <form className="card-form" onSubmit={handleSubmit}>
          <label className="field field-full">
            <span>Town name</span>
            <input
              type="text"
              value={town}
              onChange={(event) => setTown(event.target.value)}
              placeholder="Enter town name"
              autoComplete="address-level2"
              required
            />
          </label>

          <div className="form-actions">
            <button className="button button-dark" type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : 'Create town'} <span>↗</span>
            </button>
            {message && <span className="form-message">{message}</span>}
          </div>
        </form>
      </section>
    </section>
  )
}
