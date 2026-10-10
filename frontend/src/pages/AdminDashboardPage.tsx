import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  BookOpenText,
  Home,
  LayoutDashboard,
  LogOut,
  MapPinned,
  Plus,
  ShieldCheck,
} from 'lucide-react'

type AdminDashboardPageProps = {
  onLogout: () => void
}

const navigationItems = [
  { label: 'Dashboard', to: '/admin', icon: LayoutDashboard, end: true },
  { label: 'Create card', to: '/admin/cards', icon: Plus },
  { label: 'Create story', to: '/admin/stories', icon: BookOpenText },
  { label: 'Manage towns', to: '/admin/towns', icon: MapPinned },
  { label: 'Review reports', to: '/admin/reports', icon: ClipboardCheck },
]

export default function AdminDashboardPage({ onLogout }: AdminDashboardPageProps) {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const activeLabel = navigationItems.find((item) =>
    item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)
  )?.label ?? 'Admin'

  return (
    <div className={`admin-shell ${collapsed ? 'admin-shell-collapsed' : ''}`}>
      <aside className="admin-sidebar" aria-label="Admin navigation">
        <div className="admin-sidebar-brand-row">
          <Link className="admin-sidebar-brand" to="/">
            <span className="admin-dashboard-mark">YA</span>
            {!collapsed && <span>YouthAct <small>ADMIN</small></span>}
          </Link>
          <button
            className="admin-sidebar-toggle"
            type="button"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
            onClick={() => setCollapsed((value) => !value)}
          >
            {collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
          </button>
        </div>

        <p className="admin-sidebar-section-label">{!collapsed && 'Workspace'}</p>
        <nav className="admin-sidebar-nav">
          {navigationItems.map(({ label, to, icon: Icon, end }) => (
            <NavLink
              className={({ isActive }) => `admin-sidebar-link${isActive ? ' active' : ''}`}
              to={to}
              end={end}
              key={to}
              title={collapsed ? label : undefined}
              aria-label={collapsed ? label : undefined}
            >
              <Icon size={18} />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-bottom">
          <Link className="admin-sidebar-link" to="/" title={collapsed ? 'View website' : undefined}>
            <Home size={18} />
            {!collapsed && <span>View website</span>}
          </Link>
          <div className="admin-sidebar-user">
            <span className="admin-sidebar-avatar"><ShieldCheck size={16} /></span>
            {!collapsed && <span><strong>Administrator</strong><small>Signed in</small></span>}
          </div>
          <button
            className="admin-sidebar-link admin-sidebar-logout"
            type="button"
            onClick={onLogout}
            title={collapsed ? 'Log out' : undefined}
            aria-label={collapsed ? 'Log out' : undefined}
          >
            <LogOut size={18} />
            {!collapsed && <span>Log out</span>}
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div>
            <p className="admin-topbar-overline">YouthAct administration</p>
            <h1>{activeLabel}</h1>
          </div>
        </header>
        <div className="admin-main-content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
