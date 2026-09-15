        import { useState } from "react";
        import { useNavigate } from "react-router-dom";
        import {
          Combobox,
          ComboboxContent,
          ComboboxEmpty,
          ComboboxInput,
          ComboboxItem,
          ComboboxList,
        } from "@/components/ui/combobox"

       export default function TopNavbar() {
          const navigate = useNavigate();
          const [whoWeAreOpen, setWhoWeAreOpen] = useState(false);
          const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
          const frameworks = ["East-Dagon", "North-Dagon", "South-Dagon", "Dagon-Seik-Kan", ]
      return (
      <nav className="nav">
        <a className="brand" href="#top" aria-label="YouthAct home">
          <span className="brand-mark"><img src="/youthact.jpg" alt="YouthAct logo" /></span>
          <span>Youth
            <span>Act</span>
          </span>
        </a>

        <button
          className="mobile-menu-toggle"
          type="button"
          aria-label="Toggle navigation menu"
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
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
                <a href="/about">About us</a>
                <a href="/mission">Mission and values</a>
                <a href="/leadership">Leadership</a>
                <a href="/partnerships">Partnerships</a>
              </div>
            )}
          </div>
          <a href="#about">About us</a>
          <a href="#programs">Programs</a>
          <a href="#stories">Stories</a>
          <Combobox items={frameworks}>
            <ComboboxInput placeholder="Select an Area" />
            <ComboboxContent>
              <ComboboxEmpty>No items found.</ComboboxEmpty>
              <ComboboxList>
                {(item) => (
                  <ComboboxItem key={item} value={item}>
                    {item}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
          <button className="nav-weather" type="button" onClick={() => navigate('/yangon-weather')}>Weather</button>
        </div>
        <button className="nav-cta" type="button" onClick={() => navigate('/admin')}>Create card <span>↗</span></button>
      </nav>
)
       }
      
