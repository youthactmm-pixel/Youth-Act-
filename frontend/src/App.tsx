import { useEffect, useState } from 'react'
import './App.css'

type Program = {
  id: number
  title: string
  description: string
}

function App() {
  const [programs, setPrograms] = useState<Program[]>([])

  useEffect(() => {
    fetch('/api/programs')
      .then((response) => response.json())
      .then((data: Program[]) => setPrograms(data))
      .catch(() => setPrograms([]))
  }, [])

  return (
    <main>
        <link href="/src/style.css" rel="stylesheet"></link>
      <nav className="nav shell">
        <a className="brand" href="#top" aria-label="YouthAct home">
          <span className="brand-mark">Y</span>
          <span>Youth
            <span>Act</span>
          </span>
        </a>
        <div className="nav-links">
          <a href="#whoweare">Who We Are</a>
          <a href="#about">About us</a>
          <a href="#programs">Programs</a>
          <a href="#stories">Stories</a>
        </div>
        <a className="nav-cta" href="#connect">Get involved <span>↗</span></a>
      </nav>

      <section className="hero shell" id="top">
        <div className="hero-copy">
          <p className="eyebrow">A community for young changemakers</p>
          <h1>Small steps.<br /><em>Real change.</em></h1>
          <p className="hero-intro">We bring young people together to learn, create, and take action for the communities they call home.</p>
          <a className="button" href="#programs">Explore our work <span>↓</span></a></div>
        <div className="hero-art" aria-label="Young people collaborating outdoors" role="img"><div className="art-note">Make room<br />for new ideas.</div><div className="art-sticker">Be<br /><strong>curious</strong></div></div>
        <div className="hero-foot"><span>01 / 03</span><span className="line" /><span>Growing together since 2019</span></div>
      </section>

      <section className="intro-band" id="about"><div className="shell intro-grid"><p className="eyebrow">What we believe</p><div><h2>Young people are not waiting for the future. They are <em>building it now.</em></h2><p className="body-copy">YouthAct is a space for fresh thinking, honest conversations, and practical action. From the first spark of an idea to the moment it makes a difference, we are here to help it grow.</p><a className="text-link" href="#stories">Our approach <span>↗</span></a></div></div></section>

      <section className="programs shell" id="programs"><div className="section-heading"><div><p className="eyebrow">Find your way in</p><h2>There is always<br /><em>room for you.</em></h2></div><p className="body-copy">Bring your questions, your energy, and whatever you are curious about. Start wherever feels right.</p></div><div className="program-grid">{programs.map((program, index) => <article className={`program-card card-${index + 1}`} key={program.id}><span className="card-number">0{index + 1}</span><h3>{program.title}</h3><p>{program.description}</p><a href="#connect" aria-label={`Learn about ${program.title}`}>↗</a></article>)}</div></section>

      <section className="quote-band" id="stories"><div className="shell quote-inner"><span className="quote-mark">“</span><blockquote>When we make space for each other, we find the courage to make something new.</blockquote><p>— A YouthAct community member</p></div></section>

      <footer className="footer shell" id="connect"><div><a className="brand" href="#top"><span className="brand-mark">Y</span><span>Youth<span>Act</span></span></a><p className="footer-note">A little more possibility,<br />every day.</p></div><div className="footer-links"><a href="mailto:hello@youthact.org">hello@youthact.org</a><a href="#programs">Instagram ↗</a><a href="#programs">Facebook ↗</a></div><p className="copyright">© 2026 YouthAct</p></footer>
    </main>
  )
}

export default App
