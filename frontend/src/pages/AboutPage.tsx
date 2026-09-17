import TopNavbar from '@/components/ui/topnavbar'
import Footer from '@/components/ui/footer'
import { useEffect, useState } from 'react';
const API_URL = import.meta.env.VITE_API_URL;
export default function AboutPage() {
const [programs, setPrograms] = useState([]);
    useEffect(() => {
    const loadPrograms = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/programs`
        );

        if (!response.ok) {
          throw new Error(
            `API Error: ${response.status}`
          );
        }

        const data = await response.json();

        setPrograms(data);
      } catch (error) {
        console.error('Failed to load programs:', error);
      }
    };

    loadPrograms();
  }, []);
  return (
    <div className="app-shell inner-page">
      <TopNavbar mobileMenuOpen={false} onMobileMenuToggle={() => undefined} />
      <main>
        <section className="about-hero shell">
         <img  className="hero-img-about" src="/nature.jpg" alt="YouthAct campaign artwork" />
        </section>
        <section className="page-hero shell">
          <div>
            <p className="eyebrow">Who we are</p>
            <h1>Young people<br /><em>moving forward.</em></h1>
          </div>
          <p className="page-hero-copy">YouthAct is a platform for young people who care deeply about their communities and are ready to turn that care into action.</p>
        </section>

        <section className="about-feature shell">
          <img src="/youthact1.jpg" alt="YouthAct community members working together" />
          <div>
            <p className="eyebrow">Our reason to gather</p>
            <h2>Change starts with a room full of people who are willing to listen.</h2>
            <p className="body-copy">We create space for fresh thinking, honest conversations, and practical projects. Our work connects young people with the knowledge, confidence, and community they need to shape a greener, fairer future.</p>
          </div>
        </section>

        <section className="about-values">
          <div className="shell values-grid">
            <div>
              <p className="eyebrow">What guides us</p>
              <h2>Make room<br /><em>for possibility.</em></h2>
            </div>
            <div className="values-list">
              <article><span>01</span><h3>Listen first</h3><p>We begin with lived experience, curiosity, and respect for the people closest to an issue.</p></article>
              <article><span>02</span><h3>Learn together</h3><p>We share tools and ideas openly so every voice can become more confident and capable.</p></article>
              <article><span>03</span><h3>Act with care</h3><p>We turn good intentions into thoughtful action that lasts beyond a single moment.</p></article>
            </div>
          </div>
        </section>
        <Footer />
      </main>
    </div>
  )
}
