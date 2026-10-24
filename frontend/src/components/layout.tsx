import { useState, useRef, useEffect, type ReactNode } from 'react';
import {
  Bell,
  FileText,
  FolderKanban,
  HelpCircle,
  LayoutDashboard,
  Leaf,
  LogOut,
  Map,
  Activity,
  Settings,
  ChevronRight,
  Menu,
  X,
  User,
  Shield,
  Plus,
} from 'lucide-react';
import { Link, NavLink, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { IconButton } from './ui';

interface NavItem {
  to: string;
  label: string;
  icon: any;
  matchPrefix?: string;
  badge?: string;
}

const mainNavItems: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, matchPrefix: '/dashboard' },
  { to: '/projects', label: 'Projects', icon: FolderKanban, matchPrefix: '/projects' },
  { to: '/documents', label: 'Documents', icon: FileText, matchPrefix: '/documents' },
  { to: '/gis', label: 'GIS Mapping', icon: Map, matchPrefix: '/gis' },
  { to: '/mrv', label: 'MRV', icon: Activity, matchPrefix: '/mrv' },
  { to: '/settings', label: 'Settings', icon: Settings, matchPrefix: '/settings' },
];

export function Sidebar({ onCloseMobile }: { onCloseMobile?: () => void }) {
  const location = useLocation();
  const { developer } = useAuth();

  const isItemActive = (item: NavItem) => {
    if (item.matchPrefix === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    if (item.matchPrefix) {
      return location.pathname.startsWith(item.matchPrefix);
    }
    return location.pathname === item.to;
  };

  const initials = developer?.fullName
    ? developer.fullName
        .split(' ')
        .filter(Boolean)
        .map((x) => x[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'CD';

  return (
    <div className="flex h-full flex-col justify-between bg-forest text-white">
      <div>
        {/* Brand Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-6">
          <Link
            to="/dashboard"
            onClick={onCloseMobile}
            className="flex items-center gap-3 transition hover:opacity-90"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/10 shadow-inner">
              <Leaf className="h-7 w-7 text-emerald-300" />
            </div>
            <div>
              <div className="text-2xl font-black tracking-tight text-white leading-none">
                CarbonDesk
              </div>
              <p className="mt-1 text-xs font-medium text-emerald-200/80">
                Enterprise Carbon Platform
              </p>
            </div>
          </Link>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="rounded p-1 text-white/70 hover:bg-white/10 hover:text-white lg:hidden"
              aria-label="Close navigation"
            >
              <X size={22} />
            </button>
          )}
        </div>

        {/* Quick Action */}
        <div className="px-4 pt-5 pb-2">
          <Link
            to="/projects/new"
            onClick={onCloseMobile}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-white/15 px-3 py-2.5 text-xs font-bold tracking-wide uppercase text-white shadow-sm transition hover:bg-white/25 active:scale-95"
          >
            <Plus size={16} />
            <span>New Project</span>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav aria-label="Primary navigation" className="mt-3 space-y-1 px-3">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item);

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onCloseMobile}
                className={`group flex items-center justify-between rounded-lg px-4 py-3 text-sm font-semibold transition ${
                  active
                    ? 'bg-white/20 text-white shadow-sm font-bold border-l-4 border-emerald-400 pl-3'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <Icon
                    size={20}
                    className={active ? 'text-emerald-300' : 'text-white/70 group-hover:text-white'}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="rounded bg-white/20 px-2 py-0.5 text-xs font-bold text-white">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User Info Card in Sidebar Bottom */}
      <div className="border-t border-white/10 p-4">
        <Link
          to="/settings"
          onClick={onCloseMobile}
          className="group flex items-center gap-3 rounded-lg p-2.5 transition hover:bg-white/10"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 font-bold text-sm text-white shadow">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-white group-hover:text-emerald-200">
              {developer?.fullName || 'Carbon Developer'}
            </p>
            <p className="truncate text-xs text-white/70">
              {developer?.organizationName || developer?.email || 'Settings & Profile'}
            </p>
          </div>
          <Settings size={16} className="text-white/50 group-hover:text-white" />
        </Link>
      </div>
    </div>
  );
}

export function Topbar({ onOpenMobile }: { onOpenMobile?: () => void }) {
  const location = useLocation();
  const { developer, logout } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute Breadcrumbs
  const getBreadcrumbs = () => {
    const p = location.pathname;
    const parts = p.split('/').filter(Boolean);

    if (parts.length === 0 || parts[0] === 'dashboard') {
      return [{ label: 'Dashboard', to: '/dashboard' }];
    }

    const crumbs: { label: string; to?: string }[] = [];

    if (parts[0] === 'projects') {
      crumbs.push({ label: 'Projects', to: '/projects' });
      if (parts[1] === 'new') {
        crumbs.push({ label: 'New Project' });
      } else if (parts[1]) {
        crumbs.push({ label: 'Project Details', to: `/projects/${parts[1]}` });
        if (parts[2] === 'participants') {
          if (parts[3] === 'new') {
            crumbs.push({ label: 'Participants', to: `/projects/${parts[1]}/participants` });
            crumbs.push({ label: 'Add Participant' });
          } else {
            crumbs.push({ label: 'Participants' });
          }
        } else if (parts[2] === 'documents') {
          crumbs.push({ label: 'Documents' });
        } else if (parts[2] === 'gis') {
          crumbs.push({ label: 'GIS Mapping' });
        } else if (parts[2] === 'mrv') {
          crumbs.push({ label: 'MRV' });
          if (parts[4] === 'measurements') crumbs.push({ label: 'Measurements' });
          if (parts[4] === 'report') crumbs.push({ label: 'Report' });
        }
      }
    } else if (parts[0] === 'documents') {
      crumbs.push({ label: 'Documents', to: '/documents' });
      if (parts[1] === 'projects' && parts[2]) {
        crumbs.push({ label: 'Project Documents', to: `/documents/projects/${parts[2]}` });
        if (parts[3] === 'participants' && parts[4]) {
          crumbs.push({ label: 'Participant Documents' });
        }
      }
    } else if (parts[0] === 'settings' || parts[0] === 'profile') {
      crumbs.push({ label: 'Settings', to: '/settings' });
      crumbs.push({ label: 'My Profile & Account' });
    } else if (parts[0] === 'gis') {
      crumbs.push({ label: 'GIS Mapping' });
    } else if (parts[0] === 'mrv') {
      crumbs.push({ label: 'MRV' });
    } else {
      crumbs.push({ label: parts[0].charAt(0).toUpperCase() + parts[0].slice(1) });
    }

    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();
  const initials = developer?.fullName
    ? developer.fullName
        .split(' ')
        .filter(Boolean)
        .map((x) => x[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'CD';

  return (
    <header className="sticky top-0 z-30 flex min-h-20 items-center justify-between border-b border-stone-200 bg-white/95 px-4 backdrop-blur sm:px-7">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="rounded-lg p-2 text-forest transition hover:bg-stone-100 lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu size={22} />
        </button>

        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm font-semibold">
          <Link
            to="/dashboard"
            className="text-stone-400 hover:text-forest transition hidden sm:inline"
          >
            CarbonDesk
          </Link>
          <span className="text-stone-300 hidden sm:inline">/</span>
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <span key={idx} className="flex items-center gap-1.5">
                {idx > 0 && <ChevronRight size={14} className="text-stone-400" />}
                {crumb.to && !isLast ? (
                  <Link
                    to={crumb.to}
                    className="text-stone-600 transition hover:text-forest hover:underline"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className={isLast ? 'text-forest font-bold' : 'text-stone-600'}>
                    {crumb.label}
                  </span>
                )}
              </span>
            );
          })}
        </nav>
      </div>

      {/* Right: Actions & User Profile Menu */}
      <div className="flex items-center gap-2">
        <Link to="/notifications">
          <IconButton label="Notifications">
            <Bell size={20} />
          </IconButton>
        </Link>
        <IconButton label="Help Center">
          <HelpCircle size={20} />
        </IconButton>

        {/* User Profile Menu Dropdown */}
        <div className="relative ml-2" ref={profileMenuRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2.5 rounded-full p-1 transition hover:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-forest/20"
            aria-expanded={profileOpen}
            aria-label="User menu"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-forest text-sm font-bold text-white shadow-sm ring-2 ring-emerald-500/20">
              {initials}
            </div>
            <div className="hidden text-left sm:block">
              <span className="block text-xs font-bold text-ink leading-tight">
                {developer?.fullName || 'User'}
              </span>
              <span className="block text-[10px] text-stone-500">Developer</span>
            </div>
          </button>

          {/* Dropdown Menu */}
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-72 origin-top-right rounded-xl border border-stone-200 bg-white py-2 shadow-xl ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-150">
              {/* User Header Info */}
              <div className="border-b border-stone-100 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wider text-stone-500">
                  Signed in as
                </p>
                <p className="mt-0.5 truncate text-sm font-bold text-forest-deep">
                  {developer?.fullName || 'Carbon Developer'}
                </p>
                <p className="truncate text-xs text-stone-600">
                  {developer?.email}
                </p>
                {developer?.organizationName && (
                  <p className="mt-1 inline-block rounded bg-stone-100 px-2 py-0.5 text-[11px] font-semibold text-stone-700">
                    {developer.organizationName}
                  </p>
                )}
              </div>

              {/* Navigation Options */}
              <div className="py-1">
                <Link
                  to="/settings"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-50 hover:text-forest"
                >
                  <User size={18} className="text-stone-400" />
                  <span>My Profile</span>
                </Link>
                <Link
                  to="/settings?tab=account"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-50 hover:text-forest"
                >
                  <FileText size={18} className="text-stone-400" />
                  <span>Account Information</span>
                </Link>
                <Link
                  to="/settings?tab=security"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-50 hover:text-forest"
                >
                  <Shield size={18} className="text-stone-400" />
                  <span>Security & Password</span>
                </Link>
              </div>

              {/* Sign Out Option */}
              <div className="border-t border-stone-100 pt-1">
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    handleLogout();
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-danger transition hover:bg-red-50"
                >
                  <LogOut size={18} className="text-danger" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

/**
 * Reusable Authenticated Layout / AppShell
 * Can wrap children directly or host an <Outlet /> for route layout.
 */
export function AppShell({ children }: { children?: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-canvas lg:flex">
      {/* Desktop Sidebar */}
      <aside className="hidden w-[260px] shrink-0 lg:flex lg:flex-col lg:h-screen lg:sticky lg:top-0">
        <Sidebar />
      </aside>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl z-10">
            <Sidebar onCloseMobile={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Viewport */}
      <div className="min-w-0 flex-1 flex flex-col">
        <Topbar onOpenMobile={() => setMobileOpen(true)} />
        <main className="mx-auto w-full max-w-[1440px] flex-1 p-4 sm:p-6 lg:p-8">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}

export { AppShell as AuthenticatedAppLayout };
