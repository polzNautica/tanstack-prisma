import { Link } from '@tanstack/react-router'
import ThemeToggle from './ThemeToggle'
import {
  SignedIn,
  UserButton,
  SignedOut,
} from '@neondatabase/neon-js/auth/react/ui'
import { authClient } from '@/auth'

export default function Header() {
  const { data: session } = authClient.useSession()

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--header-bg)] px-4 backdrop-blur-lg">
      <nav className="page-wrap flex flex-wrap justify-between items-center gap-x-3 gap-y-2 py-3 sm:py-4">
        <h2 className="m-0 flex-shrink-0 text-base font-semibold tracking-tight">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1.5 text-sm text-[var(--sea-ink)] no-underline shadow-[0_8px_24px_rgba(30,90,72,0.08)] sm:px-4 sm:py-2"
          >
            <span className="h-2 w-2 rounded-full bg-[linear-gradient(90deg,#56c6be,#7ed3bf)]" />
            FK Tech
          </Link>
        </h2>

        <div className="flex items-center gap-8">
          <Link
            to="/"
            className="nav-link"
            activeProps={{ className: 'nav-link is-active' }}
          >
            Home
          </Link>
          <Link
            to="/admin/attendance"
            className="nav-link"
            activeProps={{ className: 'nav-link is-active' }}
          >
            Tracker
          </Link>
          <Link
            to="/about"
            className="nav-link"
            activeProps={{ className: 'nav-link is-active' }}
          >
            About
          </Link>
          <ThemeToggle />
          <SignedIn>
            <UserButton size="icon" />
          </SignedIn>
          <SignedOut>
            <Link to="/auth/sign-in" className="nav-link">
              Sign In
            </Link>
          </SignedOut>
        </div>
      </nav>
    </header>
  )
}
