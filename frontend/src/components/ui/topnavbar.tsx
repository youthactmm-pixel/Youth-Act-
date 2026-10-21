        import { useState } from "react";
        import { Link, useNavigate } from "react-router-dom";
        import { ArrowUpRight } from "lucide-react";

       export default function TopNavbar() {
          const navigate = useNavigate();
         const [whoWeAreOpen, setWhoWeAreOpen] = useState(false);
         const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
         const [mobileWhoWeAreOpen, setMobileWhoWeAreOpen] = useState(false);
      return (
          <>
            <nav className="nav">
              <Link className="brand" to="/" aria-label="YouthAct home">
                <span className="brand-mark"><img src="/tran-logo.png" alt="YouthAct logo" /></span>
                <span>YOUTH ACT
                </span>
              </Link>
              <button
                className="mobile-menu-toggle"
                type="button"
                aria-label="Toggle navigation menu"
                aria-expanded={mobileMenuOpen}
                onClick={() => setMobileMenuOpen((open) => !open)}
              >
                <span className="mobile-menu-icon">
                  <span />
                  <span />
                  <span />
                </span>
              </button>

              <div className="nav-links">
                <div className="nav-dropdown">
                  <button
                    className="nav-dropdown-button"
                    onClick={() => setWhoWeAreOpen(!whoWeAreOpen)}
                  >
                    <span className="nav-dropdown-label">
                      Who We are
                    </span>

                    <span className={`nav-drop-icon ${whoWeAreOpen ? "open" : ""}`}>
                      ▼
                    </span>
                  </button>

                  {whoWeAreOpen && (
                    <div className="nav-dropdown-children">
                      <Link to="/about">About us</Link>
                      <Link to="/mission">Mission and values</Link>
                      <Link to="/leadership">Leadership</Link>
                      <Link to="/partnerships">Partnerships</Link>
                    </div>
                  )}
                </div>
                <Link to="/programs">Programs</Link>
                <Link to="/stories">Projects</Link>
                <Link to="/community-map">Climate Mapping</Link>
              </div>
              <button className="nav-cta" type="button" onClick={() => navigate('/admin')}>Login <span>↗</span></button>
            </nav>

            <div
              className={`mobile-nav-backdrop ${mobileMenuOpen ? 'open' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            />
            <aside
              className={`mobile-nav-drawer ${mobileMenuOpen ? 'open' : ''}`}
              aria-label="Mobile navigation"
              aria-hidden={!mobileMenuOpen}
            >
              <div className="mobile-nav-drawer-header">
                <Link className="brand brand-mobile" to="/" onClick={() => setMobileMenuOpen(false)}>
                  <span className="brand-mark"><img src="/tran-logo.png" alt="" /></span>
                  <span>YOUTH ACT</span>
                </Link>
                <button
                  className="mobile-menu-close"
                  type="button"
                  aria-label="Close navigation menu"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  ×
                </button>
              </div>
              <div className="mobile-nav-drawer-content">
                <nav className="mobile-nav-section" aria-label="Main navigation">
                  <div className="nav-dropdown-mobile">
                    <button
                      className="nav-dropdown-button"
                      type="button"
                      aria-expanded={mobileWhoWeAreOpen}
                      onClick={() => setMobileWhoWeAreOpen((open) => !open)}
                    >
                      <span className="nav-dropdown-label">Who We are</span>
                      <span className={`nav-drop-icon ${mobileWhoWeAreOpen ? "open" : ""}`}>▼</span>
                    </button>
                    {mobileWhoWeAreOpen && (
                      <div className="nav-dropdown-children-mobile">
                        <Link to="/about" onClick={() => setMobileMenuOpen(false)}>About us</Link>
                        <Link to="/mission" onClick={() => setMobileMenuOpen(false)}>Mission and values</Link>
                        <Link to="/leadership" onClick={() => setMobileMenuOpen(false)}>Leadership</Link>
                        <Link to="/partnerships" onClick={() => setMobileMenuOpen(false)}>Partnerships</Link>
                      </div>
                    )}
                  </div>
                  <Link className="mobile-nav-link" to="/programs" onClick={() => setMobileMenuOpen(false)}>Programs</Link>
                  <Link className="mobile-nav-link" to="/stories" onClick={() => setMobileMenuOpen(false)}>Stories</Link>
                  <Link className="mobile-nav-link" to="/community-map" onClick={() => setMobileMenuOpen(false)}>Climate Mapping</Link>
                </nav>
                <div className="mobile-nav-actions">
                  <button
                    className="mobile-nav-link nav-weather"
                    type="button"
                    onClick={() => {
                      navigate('/community-map')
                      setMobileMenuOpen(false)
                    }}
                  >
                    Weather
                  </button>
                  <button
                    className="mobile-nav-cta"
                    type="button"
                    onClick={() => {
                      navigate('/admin')
                      setMobileMenuOpen(false)
                    }}
                  >
                    Login <ArrowUpRight size={16} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </aside>
          </>
)
           }
      
