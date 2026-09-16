        import { useEffect, useState } from "react";
        import { useNavigate } from "react-router-dom";
        import {
          Combobox,
          ComboboxContent,
          ComboboxEmpty,
          ComboboxInput,
          ComboboxItem,
          ComboboxList,
        } from "@/components/ui/combobox"
        import { fetchTowns } from "@/services/cardApi"

       type TopNavbarProps = {
         mobileMenuOpen: boolean;
         onMobileMenuToggle: () => void;
       };

       export default function TopNavbar({ mobileMenuOpen, onMobileMenuToggle }: TopNavbarProps) {
          const navigate = useNavigate();
         const [whoWeAreOpen, setWhoWeAreOpen] = useState(false);
          const [towns, setTowns] = useState<string[]>([])
          const [selectedTown, setSelectedTown] = useState('')

          useEffect(() => {
            fetchTowns()
              .then((data) => setTowns(data.map((item) => item.town)))
              .catch(() => setTowns([]))
          }, [])

          const handleTownChange = (value: string | null) => {
            const town = value ?? ''
            setSelectedTown(town)
            if (town) {
              navigate(`/yangon-weather?town=${encodeURIComponent(town)}`)
            }
          }
      return (
      <nav className="nav">
        <a className="brand" href="/" aria-label="YouthAct home">
          <span className="brand-mark"><img src="/tran-logo.png" alt="YouthAct logo" /></span>
          <span>YOUTH ACT
          </span>
        </a>
        <button
          className="mobile-menu-toggle"
          type="button"
          aria-label="Toggle navigation menu"
          aria-expanded={mobileMenuOpen}
          onClick={onMobileMenuToggle}
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
          <a href="/about">About us</a>
          <a href="/programs">Programs</a>
          <a href="/stories">Stories</a>
          <Combobox items={towns} value={selectedTown} onValueChange={handleTownChange}>
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
      
