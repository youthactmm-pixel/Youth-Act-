import { ArrowUpRight, FilePlus2, LayoutDashboard, LogOut, MapPin } from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'

type AdminDashboardProps = {
  onLogout: () => void
}

const navigation = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/projects', label: 'Projects', icon: FilePlus2, end: false },
  { to: '/admin/towns', label: 'Town directory', icon: MapPin, end: false },
]

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const location = useLocation()
  const pageTitle = location.pathname.startsWith('/admin/projects')
      || location.pathname.startsWith('/admin/cards')
    ? 'Projects'
    : location.pathname.startsWith('/admin/towns')
      ? 'Town directory'
      : 'Overview'

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <NavLink className="admin-brand" to="/admin" aria-label="YouthAct admin home">
          <span>
            <strong>YouthAct</strong>
          </span>
        </NavLink>

        <div className="admin-nav-label">Workspace</div>
        <nav className="admin-nav" aria-label="Admin navigation">
          {navigation.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`}
            >
              <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
              <span>{label}</span>
              {label === 'Projects' && <ArrowUpRight className="admin-nav-arrow" size={15} aria-hidden="true" />}
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-bottom">
          <a className="admin-site-link" href="/" target="_blank" rel="noreferrer">
            <span>View public site</span>
            <ArrowUpRight size={16} aria-hidden="true" />
          </a>
          <button className="admin-logout" type="button" onClick={onLogout}>
            <LogOut size={17} aria-hidden="true" />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      <div className="admin-workspace">
        <header className="admin-topbar">
          <div>
            <span className="admin-topbar-kicker">YouthAct / Admin</span>
            <h1>{pageTitle}</h1>
          </div>
          <span className="admin-user-mark" aria-label="Administrator">A</span>
        </header>
        <main className="admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export function AdminOverview() {
  return (
    <section className="admin-overview">
      <div className="admin-overview-heading">
        <p className="admin-kicker">YOUTHACT CONTENT STUDIO</p>
        <h2>Make the next good thing visible.</h2>
        <p>Manage the programs and communities shown across the YouthAct website.</p>
      </div>

      <div className="admin-overview-actions">
        <NavLink className="admin-action-row" to="/admin/projects">
          <span className="admin-action-icon card-icon"><FilePlus2 size={21} aria-hidden="true" /></span>
          <span className="admin-action-copy">
            <small>PROJECTS</small>
            <strong>Create or edit a project</strong>
            <span>Update the projects shown on the site.</span>
          </span>
          <ArrowUpRight size={20} aria-hidden="true" />
        </NavLink>
        <NavLink className="admin-action-row" to="/admin/towns">
          <span className="admin-action-icon town-icon"><MapPin size={21} aria-hidden="true" /></span>
          <span className="admin-action-copy">
            <small>COMMUNITIES</small>
            <strong>Manage towns</strong>
            <span>Add and update the towns in the directory.</span>
          </span>
          <ArrowUpRight size={20} aria-hidden="true" />
        </NavLink>
      </div>
    </section>
  )
}