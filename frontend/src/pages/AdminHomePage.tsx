import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, ClipboardCheck, ExternalLink, MapPinned, Plus, ShieldCheck } from 'lucide-react'
import { fetchCards, type CardModel } from '@/services/Api'

const adminSections = [
  {
    title: 'Create and manage cards',
    description: 'Publish and update program cards, descriptions, and images shown on the website.',
    href: '/admin/cards',
    action: 'Open card management',
    icon: Plus,
    accent: 'admin-dashboard-accent-coral',
  },
  {
    title: 'Create and manage towns',
    description: 'Add townships and edit the town list used across the site.',
    href: '/admin/towns',
    action: 'Open town management',
    icon: MapPinned,
    accent: 'admin-dashboard-accent-green',
  },
  {
    title: 'Review community reports',
    description: 'Review incoming climate observations and approve safe descriptions for the public map.',
    href: '/admin/reports',
    action: 'Open report queue',
    icon: ClipboardCheck,
    accent: 'admin-dashboard-accent-gold',
  },
]

export default function AdminHomePage() {
  const [cards, setCards] = useState<CardModel[]>([])
  const [isLoadingCards, setIsLoadingCards] = useState(true)
  const [cardsError, setCardsError] = useState('')

  useEffect(() => {
    fetchCards()
      .then(setCards)
      .catch((error: unknown) => {
        setCardsError(error instanceof Error ? error.message : 'Unable to load cards and projects.')
      })
      .finally(() => setIsLoadingCards(false))
  }, [])

  const statusCounts = useMemo(() => ({
    total: cards.length,
    active: cards.filter((card) => card.status === 'active').length,
    draft: cards.filter((card) => card.status === 'draft').length,
  }), [cards])

  return (
    <section className="admin-dashboard-home">
      <section className="admin-content-section" aria-labelledby="admin-content-title">
        <header className="admin-content-heading">
          <div>
            <p className="eyebrow">Website content</p>
            <h2 id="admin-content-title">Cards and projects</h2>
            <p>These cards appear on the website and link to their project detail pages.</p>
          </div>
          <div className="admin-content-shortcuts">
            <Link to="/admin/stories">Create story <ArrowUpRight size={15} /></Link>
            <Link to="/admin/cards">Create card <ArrowUpRight size={15} /></Link>
          </div>
        </header>

        {cardsError && <p className="admin-content-error" role="alert">{cardsError}</p>}
        {isLoadingCards ? (
          <p className="admin-content-empty" role="status">Loading cards and projects…</p>
        ) : cards.length === 0 ? (
          <div className="admin-content-empty">
            <p>No cards or projects have been created yet.</p>
            <Link to="/admin/cards">Create your first card <ArrowUpRight size={15} /></Link>
          </div>
        ) : (
          <div className="admin-content-list">
            {cards.map((card) => {
              const images = card.images?.length ? card.images : [card.image]
              return (
                <article className="admin-content-row" key={card.id}>
                  <img className="admin-content-thumbnail" src={images[0]} alt="" />
                  <div className="admin-content-details">
                    <strong>{card.title}</strong>
                    <p>{card.category} · {card.description}</p>
                  </div>
                  <span className={`admin-content-status admin-content-status-${card.status.toLowerCase()}`}>{card.status}</span>
                  <div className="admin-content-actions">
                    <Link to={`/project/${card.id}/projectdetailpage`} aria-label={`View project ${card.title}`} title="View project">
                      <ExternalLink size={16} />
                    </Link>
                    <Link to={`/admin/cards?edit=${encodeURIComponent(card.id)}`} aria-label={`Edit ${card.title}`} title="Edit card">
                      <ArrowUpRight size={17} />
                    </Link>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <div className="admin-dashboard-note">
        <ShieldCheck size={17} />
        <p>Review community reports before they appear publicly.</p>
      </div>
    </section>
  )
}
