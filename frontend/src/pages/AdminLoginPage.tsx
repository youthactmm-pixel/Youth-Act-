import { useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, LockKeyhole, ShieldCheck } from 'lucide-react'
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
    <main className="admin-login">
      <div className="admin-login-layout">
        <section className="admin-login-story" aria-label="About YouthAct">
          <div className="admin-login-brand">
            <span className="admin-login-brand-mark">Y</span>
            <span>YouthAct</span>
          </div>
          <div className="admin-login-story-copy">
            <p className="admin-login-overline">Young people. Lasting change.</p>
            <h1>Make a difference, every day.</h1>
            <p>
              A space for the people building stronger, more resilient
              communities across Myanmar.
            </p>
          </div>
          <div className="admin-login-story-footer">
            <span className="admin-login-story-line" />
            <span>Empowering youth. Strengthening communities.</span>
          </div>
        </section>

        <section className="admin-login-panel" aria-labelledby="admin-login-title">
          <button className="admin-login-back" type="button" onClick={onBack}>
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Back to home</span>
          </button>

          <div className="admin-login-content">
            <div className="admin-login-heading">
              <span className="admin-login-icon">
                <LockKeyhole size={20} aria-hidden="true" />
              </span>
              <p className="admin-login-overline">YouthAct administration</p>
              <h2 id="admin-login-title">Welcome back</h2>
              <p>Sign in to access your dashboard and manage your work.</p>
            </div>

            <form className="admin-login-form" onSubmit={handleSubmit}>
              <label className="admin-login-field">
                <span>Username</span>
                <input
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Enter your username"
                  autoComplete="username"
                  required
                />
              </label>

              <label className="admin-login-field">
                <span>Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
              </label>

              {message && (
                <p className="admin-login-message" role="alert">
                  {message}
                </p>
              )}

              <button className="admin-login-submit" type="submit" disabled={submitting}>
                <span>{submitting ? 'Signing in...' : 'Sign in to dashboard'}</span>
                <ArrowRight size={18} aria-hidden="true" />
              </button>
            </form>

            <div className="admin-login-security">
              <ShieldCheck size={17} aria-hidden="true" />
              <span>Secure access for authorized team members</span>
            </div>
          </div>

          <p className="admin-login-copyright">© YouthAct · Together for a better future</p>
        </section>
      </div>
    </main>
  )
}
