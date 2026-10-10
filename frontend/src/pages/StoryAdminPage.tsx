import { useEffect, useState, type FormEvent } from 'react'
import { ArrowUpRight, BookOpenText, ImagePlus } from 'lucide-react'
import { createStory, fetchAdminStories, type StoryCreateInput, type StoryModel } from '@/services/Api'

type StoryAdminPageProps = {
  onBack: () => void
  onLogout: () => void
}

const emptyStory: StoryCreateInput = {
  title: '',
  type: 'Community story',
  description: '',
  image: '',
  status: 'draft',
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
      const context = canvas.getContext('2d')
      URL.revokeObjectURL(objectUrl)
      if (!context) {
        reject(new Error('Unable to process the selected image.'))
        return
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', 0.8))
    }
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Unable to process the selected image.'))
    }
    image.src = objectUrl
  })
}

export default function StoryAdminPage({ onBack, onLogout }: StoryAdminPageProps) {
  const [form, setForm] = useState<StoryCreateInput>(emptyStory)
  const [stories, setStories] = useState<StoryModel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isProcessingImage, setIsProcessingImage] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchAdminStories()
      .then(setStories)
      .catch((loadError: unknown) => {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load stories.')
      })
      .finally(() => setIsLoading(false))
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.image) {
      setError('Add a cover image before saving this story.')
      return
    }

    setError('')
    setMessage('')
    setIsSubmitting(true)
    try {
      const story = await createStory({
        ...form,
        title: form.title.trim(),
        type: form.type.trim(),
        description: form.description.trim(),
      })
      setStories((currentStories) => [story, ...currentStories])
      setForm(emptyStory)
      setMessage(story.status === 'active' ? 'Story published successfully.' : 'Story saved as a draft.')
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to save the story.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleImageChange(file?: File) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Choose an image file.')
      return
    }
    if (file.size > 15 * 1024 * 1024) {
      setError('The image must be smaller than 15 MB.')
      return
    }
    setError('')
    setIsProcessingImage(true)
    try {
      const image = await compressImage(file)
      setForm((currentForm) => ({ ...currentForm, image }))
    } catch (imageError) {
      setError(imageError instanceof Error ? imageError.message : 'Unable to process the selected image.')
    } finally {
      setIsProcessingImage(false)
    }
  }

  return (
    <section className="admin-page fade-section">
      <div className="admin-page-top shell">
        <div>
          <p className="eyebrow">YouthAct Dashboard</p>
          <h1>Create a story</h1>
        </div>
        <div className="admin-page-top-actions">
          <button className="button button-dark" type="button" onClick={onBack}>Back to dashboard <span>↗</span></button>
          <button className="button button-dark" type="button" onClick={onLogout}>Logout <span>↗</span></button>
        </div>
      </div>

      <section className="card-form-section shell story-admin-form-section">
        <header className="story-admin-intro">
          <span><BookOpenText size={19} /></span>
          <div>
            <h2>Share a community story</h2>
            <p>Tell people about the work, ideas, and people moving YouthAct forward.</p>
          </div>
        </header>
        <form className="card-form" onSubmit={handleSubmit}>
          <div className="form-grid story-form-grid">
            <label className="field">
              <span>Story title</span>
              <input maxLength={160} required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Give your story a title" />
            </label>
            <label className="field">
              <span>Story type</span>
              <input maxLength={80} required value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} placeholder="e.g. Field notes, People" />
            </label>
            <label className="field">
              <span>Publishing status</span>
              <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as StoryCreateInput['status'] })}>
                <option value="draft">Save as draft</option>
                <option value="active">Publish now</option>
              </select>
            </label>
          </div>
          <label className="field field-full">
            <span>Story</span>
            <textarea maxLength={4000} required value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Write the story you want to share…" />
            <small className="story-character-count">{form.description.length}/4000 characters</small>
          </label>
          <div className="field field-full">
            <span>Cover image</span>
            <label className="story-image-picker">
              <input type="file" accept="image/*" onChange={(event) => {
                void handleImageChange(event.target.files?.[0])
                event.target.value = ''
              }} />
              {form.image ? (
                <img src={form.image} alt="Story cover preview" />
              ) : (
                <span className="story-image-placeholder"><ImagePlus size={23} /><strong>{isProcessingImage ? 'Processing image…' : 'Choose a cover image'}</strong><small>JPG, PNG, or WebP · up to 15 MB</small></span>
              )}
              {form.image && <span className="story-image-change">Change image</span>}
            </label>
          </div>
          <div className="form-actions">
            <button className="button button-dark" type="submit" disabled={isSubmitting || isProcessingImage}>
              {isSubmitting ? 'Saving…' : form.status === 'active' ? 'Publish story' : 'Save draft'} <span>↗</span>
            </button>
            {error && <span className="form-message" role="alert">{error}</span>}
            {message && <span className="story-success-message" role="status">{message}</span>}
          </div>
        </form>
      </section>

      <section className="card-form-section shell story-admin-list">
        <div className="existing-cards-heading">
          <div>
            <p className="eyebrow">Story library</p>
            <h2>Saved stories</h2>
            <p>Published stories appear on the public Stories page. Drafts remain private.</p>
          </div>
          <span className="existing-cards-count">{stories.length} {stories.length === 1 ? 'story' : 'stories'}</span>
        </div>
        {error && stories.length === 0 && <p className="admin-content-error" role="alert">{error}</p>}
        {isLoading ? (
          <p className="admin-content-empty" role="status">Loading stories…</p>
        ) : stories.length === 0 ? (
          <div className="existing-cards-empty">
            <span aria-hidden="true">✦</span>
            <strong>No stories yet</strong>
            <p>Create your first story using the form above.</p>
          </div>
        ) : (
          <div className="story-admin-list-items">
            {stories.map((story) => (
              <article className="story-admin-item" key={story.id}>
                <img src={story.image} alt="" />
                <div><span>{story.type}</span><strong>{story.title}</strong><p>{story.description}</p></div>
                <span className={`admin-content-status admin-content-status-${story.status}`}>{story.status}</span>
                {story.status === 'active' && <a href="/#/stories" aria-label={`View ${story.title}`} title="View story"><ArrowUpRight size={17} /></a>}
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  )
}
