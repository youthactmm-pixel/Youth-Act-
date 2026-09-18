import { useState, type FormEvent } from 'react'
import { loginAdmin } from '../services/auth'

type AdminLoginPageProps = {
  onSuccess: () => void
  onBack: () => void
}

export default function AdminLoginPage({ onSuccess, onBack }: AdminLoginPageProps) {
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!username.trim() || !password.trim()) {
      setMessage('Please enter both username and password.')
      return
    }

    setSubmitting(true)
    setMessage('')

    try {
      await loginAdmin(username.trim(), password)
      onSuccess()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to sign in.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="admin-page fade-section">
      <div className="admin-page-top shell">
        <div>
          <p className="eyebrow">YouthAct Dashboard</p>
          <h1>Admin login</h1>
        </div>
        <button className="button button-dark" type="button" onClick={onBack}>
          Back to home <span>↗</span>
        </button>
      </div>

      <section className="card-form-section shell">
        <form className="card-form" onSubmit={handleSubmit}>
          <label className="field field-full">
            <span>Username</span>
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="admin"
              autoComplete="username"
              required
            />
          </label>

          <label className="field field-full">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter admin password"
              autoComplete="current-password"
              required
            />
          </label>

          <div className="form-actions">
            <button className="button button-dark" type="submit" disabled={submitting}>
              {submitting ? 'Signing in...' : 'Login'} <span>↗</span>
            </button>
            {message && <span className="form-message">{message}</span>}
          </div>
        </form>
      </section>
    </section>
  )
}
