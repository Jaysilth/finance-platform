import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, Wallet, ArrowLeftRight, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/accounts', label: 'Accounts', icon: Wallet },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
]

export function AppLayout() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen flex bg-paper">
      <aside className="w-56 shrink-0 border-r border-line flex flex-col">
        <div className="px-5 py-6">
          <p className="font-mono text-xs tracking-widest text-muted uppercase">
            Finance
          </p>
          <p className="font-semibold text-lg leading-tight">Intelligence Platform</p>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? 'bg-accent text-white'
                    : 'text-ink/70 hover:bg-ink/5 hover:text-ink'
                }`
              }
            >
              <Icon size={16} strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-line">
          <p className="px-3 text-sm text-ink/80 truncate">{user?.fullName}</p>
          <p className="px-3 text-xs text-muted truncate mb-2">{user?.email}</p>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-3 py-2 w-full rounded-md text-sm text-ink/60 hover:bg-ink/5 hover:text-ink transition-colors"
          >
            <LogOut size={16} />
            Log out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
