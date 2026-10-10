import { useEffect, useState, type FormEvent } from 'react'
import {
  createCard,
  fetchCards,
  updateCard,
  type CardCreateInput,
  type CardModel,
} from '../services/Api'
import {
  Card,
  CardContent,
  CardDescription,
  CardImage,
  CardTitle,
} from '@/components/ui/card'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

type CardAdminPageProps = {
  onBack: () => void
  onLogout: () => void
  onReviewReports: () => void
  initialCardId?: string
}

const emptyForm: CardCreateInput = {
  image: '',
  images: [],
  title: '',
  description: '',
  category: 'program',
  status: 'active',
}

const CARDS_PER_PAGE = 6

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

export default function CardAdminPage({ onBack, onLogout, onReviewReports, initialCardId }: CardAdminPageProps) {
  const [form, setForm] = useState<CardCreateInput>(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [cards, setCards] = useState<CardModel[]>([])
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [processingImages, setProcessingImages] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const loadCards = async () => {
    try {
      const nextCards = await fetchCards()
      setCards(nextCards)
      setCurrentPage((page) => Math.min(page, Math.max(1, Math.ceil(nextCards.length / CARDS_PER_PAGE))))
      if (initialCardId) {
        const cardToEdit = nextCards.find((card) => card.id === initialCardId)
        if (cardToEdit) handleEdit(cardToEdit)
      }
    } catch (error) {
      setCards([])
      console.error(error)
    }
  }

  useEffect(() => {
    loadCards()
  }, [initialCardId])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category.trim(),
      status: form.status.trim(),
      image: form.images?.[0] ?? form.image,
      images: form.images?.length ? form.images : [form.image],
    }

    if (!payload.title || !payload.description || !payload.category || !payload.status || !payload.images[0]) {
      setMessage('Please complete every card field and attach at least one image.')
      return
    }

    if (processingImages) {
      setMessage('Wait for selected images to finish processing.')
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
      images: card.images?.length ? card.images : [card.image],
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

  const pageCount = Math.max(1, Math.ceil(cards.length / CARDS_PER_PAGE))
  const visibleCards = cards.slice((currentPage - 1) * CARDS_PER_PAGE, currentPage * CARDS_PER_PAGE)

  return (
    <section className="admin-page fade-section">
      <div className="admin-page-top shell">
        <div>
          <p className="eyebrow">YouthAct Dashboard</p>
          <h1>{selectedCardId ? 'Edit card' : 'Create a card'}</h1>
        </div>
        <div className="admin-page-top-actions">
          <button className="button button-dark" type="button" onClick={onReviewReports}>
            Review reports
          </button>
          <button className="button button-dark" type="button" onClick={onBack}>
            Back to dashboard <span>↗</span>
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
            <span>Add Images (up to 8)</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={async (event) => {
                const files = Array.from(event.target.files ?? [])
                event.target.value = ''
                if (files.length === 0) return

                const currentImages = form.images?.length ? form.images : form.image ? [form.image] : []
                if (currentImages.length + files.length > 8) {
                  setMessage('A card can have up to 8 images. Remove an image before adding more.')
                  return
                }
                if (files.some((file) => file.size > 15 * 1024 * 1024)) {
                  setMessage('Each image must be smaller than 15 MB.')
                  return
                }

                setProcessingImages(true)
                setMessage('')
                try {
                  const newImages = await Promise.all(files.map(compressImage))
                  const allImages = [...currentImages, ...newImages]
                  if (allImages.reduce((total, image) => total + image.length, 0) > 8 * 1024 * 1024) {
                    throw new Error('The combined images are too large. Choose fewer or smaller images.')
                  }
                  setForm((current) => ({
                    ...current,
                    image: allImages[0],
                    images: allImages,
                  }))
                } catch (error) {
                  setMessage(error instanceof Error ? error.message : 'Unable to process the selected images.')
                } finally {
                  setProcessingImages(false)
                }
              }}
            />
            <span className="card-image-help">
              {processingImages ? 'Processing selected images…' : `${form.images?.length ?? (form.image ? 1 : 0)} of 8 attached`}
            </span>
            {!!form.images?.length && (
              <div className="card-image-preview-list">
                {form.images.map((image, index) => (
                  <div className="card-image-preview" key={`${index}-${image.slice(-24)}`}>
                    <img src={image} alt={`Card attachment ${index + 1}`} />
                    <button
                      type="button"
                      aria-label={`Remove image ${index + 1}`}
                      onClick={() => {
                        const images = form.images?.filter((_, imageIndex) => imageIndex !== index) ?? []
                        setForm({ ...form, image: images[0] ?? '', images })
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </label>

          <div className="form-actions">
            <button className="button button-dark" type="submit" disabled={submitting || processingImages}>
              {processingImages ? 'Processing images…' : submitting ? 'Saving...' : selectedCardId ? 'Update card' : 'Create card'} <span>↗</span>
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

      <section className="card-form-section shell existing-cards-section">
        <div className="existing-cards-heading">
          <div>
            <p className="eyebrow">Content library</p>
            <h2>Existing cards</h2>
            <p>Browse and edit the cards currently shown on your website.</p>
          </div>
          <span className="existing-cards-count">{cards.length} {cards.length === 1 ? 'card' : 'cards'}</span>
        </div>

        {cards.length === 0 ? (
          <div className="existing-cards-empty">
            <span aria-hidden="true">✦</span>
            <strong>No cards yet</strong>
            <p>Create your first card using the form above.</p>
          </div>
        ) : (
          <>
            <div className="existing-cards-grid">
              {visibleCards.map((card) => {
                const images = card.images?.length ? card.images : [card.image]
                return (
                  <Card className="existing-card" key={card.id}>
                    <CardImage className="existing-card-image">
                      <img src={images[0]} alt={card.title} />
                      {images.length > 1 && <span className="existing-card-image-count">+{images.length - 1} photos</span>}
                    </CardImage>
                    <CardContent className="existing-card-content">
                      <div className="existing-card-meta">
                        <span className={`existing-card-status existing-card-status-${card.status.toLowerCase()}`}>{card.status}</span>
                        <span>{card.category}</span>
                      </div>
                      <CardTitle className="existing-card-title">{card.title}</CardTitle>
                      <CardDescription className="existing-card-description">{card.description}</CardDescription>
                      <button className="existing-card-edit" type="button" onClick={() => handleEdit(card)}>
                        Edit card <span aria-hidden="true">↗</span>
                      </button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
            {pageCount > 1 && (
              <div className="existing-cards-pagination">
                <p>Showing {(currentPage - 1) * CARDS_PER_PAGE + 1}–{Math.min(currentPage * CARDS_PER_PAGE, cards.length)} of {cards.length}</p>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        aria-disabled={currentPage === 1}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                        onClick={(event) => {
                          event.preventDefault()
                          setCurrentPage((page) => Math.max(1, page - 1))
                        }}
                      />
                    </PaginationItem>
                    {Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          isActive={page === currentPage}
                          aria-label={`Go to page ${page}`}
                          onClick={(event) => {
                            event.preventDefault()
                            setCurrentPage(page)
                          }}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        aria-disabled={currentPage === pageCount}
                        className={currentPage === pageCount ? 'pointer-events-none opacity-50' : ''}
                        onClick={(event) => {
                          event.preventDefault()
                          setCurrentPage((page) => Math.min(pageCount, page + 1))
                        }}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </section>
    </section>
  )
}
