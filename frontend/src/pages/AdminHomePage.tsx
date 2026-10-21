import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, ExternalLink, ShieldCheck } from 'lucide-react'
import { FormattedText } from '@/components/RichText'
import {
  fetchCards,
  fetchClimateReports,
  getPublicClimateReportImageUrl,
  type CardModel,
  type ClimateReport,
} from '@/services/Api'

export default function AdminHomePage() {
  // Admin dashboard မှာ ပြမယ့် card/report data နဲ့ fetch လုပ်နေစဉ်၊ error ဖြစ်စဉ်ကို သီးခြားထိန်းထားသည်။
  const [cards, setCards] = useState<CardModel[]>([])
  const [isLoadingCards, setIsLoadingCards] = useState(true)
  const [cardsError, setCardsError] = useState('')
  const [reports, setReports] = useState<ClimateReport[]>([])
  const [isLoadingReports, setIsLoadingReports] = useState(true)
  const [reportsError, setReportsError] = useState('')

  useEffect(() => {
    // Website project cards ကို တစ်ကြိမ်ရယူပြီး state ပြောင်းလဲမှုက card list UI ကို ပြန် render လုပ်စေသည်။
    fetchCards()
      .then(setCards)
      .catch((error: unknown) => {
        setCardsError(error instanceof Error ? error.message : 'Unable to load cards and projects.')
      })
      .finally(() => setIsLoadingCards(false))
  }, [])

  useEffect(() => {
    // Approved/public climate report များကို ရယူသည်။ Component ထွက်သွားလျှင် request ကို abort လုပ်ပြီး
    // မလိုအပ်တော့သော response က state ကို ပြောင်းလဲခြင်း မဖြစ်စေပါ။
    const controller = new AbortController()
    fetchClimateReports(controller.signal)
      .then((data) => setReports(data.reports))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setReportsError(error instanceof Error ? error.message : 'Unable to load approved community reports.')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingReports(false)
      })
    return () => controller.abort()
  }, [])

  // Kobo ရဲ့ underscore/dash ပါတဲ့ code ကို လူဖတ်လို့ရအောင် အမည်ပုံစံပြောင်းပေးသည်။
  function issueTypeLabel(choice: string) {
    const readable = choice.replace(/[_-]+/g, ' ').trim()
    return readable ? readable.charAt(0).toLocaleUpperCase() + readable.slice(1) : 'Not specified'
  }

  // API က issueTypes array မပေးထားတဲ့ အဟောင်း report များအတွက် issueType စာသားမှ type များကို ခွဲယူသည်။
  function reportIssueTypes(report: ClimateReport) {
    return report.issueTypes?.length
      ? report.issueTypes
      : report.issueType.split(/\s*,\s*/).filter(Boolean)
  }

  // Issue type တစ်ခုထက်ပိုပါက comma ဖြင့်ဖော်ပြပြီး alt/ARIA label တွင်ပါ ပြန်သုံးသည်။
  function displayIssueType(issueType: string) {
    return issueType.split(/\s*,\s*/).filter(Boolean).map(issueTypeLabel).join(', ') || 'Not specified'
  }

  // Observation date ကို browser locale အလိုက် ဖတ်ရလွယ်တဲ့ နေ့/လ/နှစ်ပုံစံ ပြောင်းပေးသည်။
  function readableDate(observationDate: string) {
    return new Date(observationDate).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Backend response ထဲ status မတူတဲ့ report ပါလာခဲ့ရင်တောင် approved report သာ dashboard မှာပြသည်။
  const filteredReports = reports.filter((report) => report.status === 'approved')

  return (
    <section className="admin-dashboard-home">
      <section className="admin-content-section" aria-labelledby="admin-content-title">
        <header className="admin-content-heading">
          <div>
            <p className="eyebrow">Website content</p>
            <h2 id="admin-content-title">Projects</h2>
            <p>These projects appear on the website and link to their project detail pages.</p>
          </div>
          <div className="admin-content-shortcuts">
            <Link to="/admin/cards">Create Project <ArrowUpRight size={15} /></Link>
          </div>
        </header>

        {/* Project များမပြမီ loading/error ကိုပြပြီး၊ data ရလာလျှင် project card များကို map ဖြင့် ဖန်တီးသည်။ */}
        {cardsError && <p className="admin-content-error" role="alert">{cardsError}</p>}
        {isLoadingCards ? (
          <p className="admin-content-empty" role="status">Loading cards and projects…</p>
        ) : cards.length === 0 ? (
          <div className="admin-content-empty">
            <p>No projects have been created yet.</p>
            <Link to="/admin/cards">Create your first Project <ArrowUpRight size={15} /></Link>
          </div>
        ) : (
          <div className="admin-content-list">
            {/* Project တစ်ခုစီတွင် ပထမပုံ၊ အချက်အလက်နဲ့ ကြည့်ရန်/ပြင်ဆင်ရန် link များကို ချိတ်ဆက်ထားသည်။ */}
            {cards.map((card) => {
              const images = card.images?.length ? card.images : [card.image]
              return (
                <article className="admin-content-row" key={card.id}>
                  <img className="admin-content-thumbnail" src={images[0]} alt="" />
                  <div className="admin-content-details">
                    <strong>{card.title}</strong>
                    <p>{card.category} · <FormattedText text={card.description} /></p>
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

      <section className="community-observations" aria-labelledby="community-observations-title">
          <div className="community-observations-heading">
            <div>
              <p className="community-kicker">KOBO TOOLBOX · APPROVED SUBMISSIONS</p>
              <h2 id="community-observations-title">Community climate observations</h2>
              <p>Field observations shared through KoboToolbox and reviewed by the YouthAct team.</p>
            </div>
            <span>{filteredReports.length} {filteredReports.length === 1 ? 'observation' : 'observations'}</span>
          </div>
          {/* Loading/error/empty အခြေအနေများကို ခွဲပြပြီး approved report များသာ အောက်တွင် စာရင်းပြသည်။ */}
          {reportsError && <p className="admin-content-error" role="alert">{reportsError}</p>}
          {isLoadingReports && reports.length === 0 ? (
            <p className="community-observations-empty" role="status">Loading approved KoboToolbox observations…</p>
          ) : filteredReports.length === 0 ? (
            <p className="community-observations-empty">
              No approved reports are available yet. New submissions appear here after admin review.
            </p>
          ) : (
            <div className="community-observation-grid">
              {/* UI မလေးစေရန် report အများဆုံး 30 ခုသာပြသည်။ issue/date helper များက card စာသားကို ပြင်ဆင်ပေးသည်။ */}
              {filteredReports.slice(0, 10).map((report) => (
                <article className="community-observation-card" key={report.id}>
                  {report.imageUrl && (
                    <img
                      className="community-observation-image"
                      src={getPublicClimateReportImageUrl(report.imageUrl)}
                      alt={`Submitted photo for ${displayIssueType(report.issueType)} in ${report.township}`}
                      loading="lazy"
                      onError={(event) => { event.currentTarget.hidden = true }}
                    />
                  )}
                  <div className="community-observation-card-top">
                    <span className={`community-observation-severity community-observation-severity-${report.severity}`}>
                      {report.severity}
                    </span>
                    {report.verified && <span className="verified-label">Verified</span>}
                  </div>
                  <h3 className="community-observation-issues-label">Issue type</h3>
                  <ul className="community-observation-issues" aria-label={`Issue type: ${displayIssueType(report.issueType)}`}>
                    {reportIssueTypes(report).slice(0, 1).map((choice) => (
                      <li key={`${report.id}-${choice}`}>{issueTypeLabel(choice)}</li>
                    ))}
                  </ul>
                  <p className="community-observation-location">{report.township} · {readableDate(report.observationDate)}</p>
                  {report.description ? (
                    <FormattedText as="p" className="community-observation-description" text={report.description} />
                  ) : (
                    <p className="community-observation-description is-empty">No public description was added.</p>
                  )}
                </article>
              ))}
            </div>
          )}
          {filteredReports.length > 10 && (
            // 30 ခုထက်ပိုရှိလျှင် အောက်ပါစာသားဖြင့် ပြသထားသည့်အရေအတွက်ကို အသုံးပြုသူအား အသိပေးသည်။
            <p className="community-observations-footnote">
              Showing the latest 10 of {filteredReports.length} approved observations.
            </p>
          )}
        </section>

      <div className="admin-dashboard-note">
        <ShieldCheck size={17} />
        <p>Review community reports before they appear publicly.</p>
      </div>
    </section>
  )
}
