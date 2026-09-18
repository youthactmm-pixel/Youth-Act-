import { useEffect, useState, type FormEvent } from 'react'
import { createTown, fetchTowns, updateTown, type TownModel } from '../services/Api'

type CreateTownPageProps = {
  onBack: () => void
  onLogout: () => void
}

export default function CreateTownPage({ onBack, onLogout }: CreateTownPageProps) {
  const [town, setTown] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [towns, setTowns] = useState<TownModel[]>([])
  const [selectedTownId, setSelectedTownId] = useState<string | null>(null)

  const loadTowns = async () => {
    try {
      const nextTowns = await fetchTowns()
      setTowns(nextTowns)
    } catch (error) {
      setTowns([])
      console.error(error)
    }
  }

  useEffect(() => {
    loadTowns()
  }, [])

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
      if (selectedTownId) {
        await updateTown(selectedTownId, townName)
        setMessage('Town updated successfully.')
      } else {
        await createTown(townName)
        setMessage('Town created successfully.')
      }

      setTown('')
      setSelectedTownId(null)
      await loadTowns()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save the town.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleEdit(townItem: TownModel) {
    setSelectedTownId(townItem.id)
    setTown(townItem.town)
    setMessage('Editing town: ' + townItem.town)
  }

  function handleNewTown() {
    setSelectedTownId(null)
    setTown('')
    setMessage('')
  }

  return (
    <section className="admin-page fade-section">
      <div className="admin-page-top shell">
        <div>
          <p className="eyebrow">YouthAct Dashboard</p>
          <h1>{selectedTownId ? 'Edit town' : 'Create a town'}</h1>
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
              {submitting ? 'Saving...' : selectedTownId ? 'Update town' : 'Create town'} <span>↗</span>
            </button>
            {selectedTownId && (
              <button className="button button-dark" type="button" onClick={handleNewTown}>
                Create new town
              </button>
            )}
            {message && <span className="form-message">{message}</span>}
          </div>
        </form>
      </section>

      <section className="card-form-section shell" style={{ marginTop: '24px' }}>
        <h2 style={{ marginTop: 0, marginBottom: '16px' }}>Existing towns</h2>
        <div style={{ display: 'grid', gap: '12px' }}>
          {towns.length === 0 ? (
            <p>No towns found yet.</p>
          ) : (
            towns.map((townItem) => (
              <div key={townItem.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center', padding: '12px 16px', border: '1px solid #dfe7e5', borderRadius: '12px', background: 'rgba(255,255,255,0.6)' }}>
                <strong>{townItem.town}</strong>
                <button className="button button-dark" type="button" onClick={() => handleEdit(townItem)}>
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
