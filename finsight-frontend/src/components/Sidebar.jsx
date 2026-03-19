import { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  CreditCard,
  Gift,
  Trophy,
  Settings,
  X,
  Bot
} from 'lucide-react';

/* Per-page accent colours for the active left border */
const PAGE_ACCENT = {
  '/dashboard':    '#22c55e',
  '/risk':         '#f59e0b',
  '/card-wins':    '#ef4444',
  '/subscriptions':'#f59e0b',
  '/challenges':   '#f97316',
  '/test-ml':      '#3b82f6',
  '/settings':     '#6b7280',
};

const navLinks = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Risk Forecast',
    path: '/risk',
    icon: TrendingUp,
    badge: { label: '1', style: 'danger-solid' },
  },
  {
    name: 'Card Wins',
    path: '/card-wins',
    icon: Gift,
    badge: { label: '₹340', style: 'danger-soft' },
  },
  {
    name: 'Subscriptions',
    path: '/subscriptions',
    icon: CreditCard,
    badge: { label: '2', style: 'amber-soft' },
  },
  {
    name: 'Challenges',
    path: '/challenges',
    icon: Trophy,
  },
  {
    name: 'ML Playground',
    path: '/test-ml',
    icon: Bot,
    badge: { label: 'NEW', style: 'amber-soft' },
  },
];

function Badge({ badge }) {
  if (!badge) return null;

  const base = 'flex items-center justify-center font-bold text-[10px] rounded-full';

  if (badge.style === 'danger-solid')
    return (
      <span
        className={`${base} w-4 h-4`}
        style={{ background: '#ef4444', color: '#fff' }}
      >
        {badge.label}
      </span>
    );

  if (badge.style === 'danger-soft')
    return (
      <span
        className={`${base} px-1.5 py-0.5`}
        style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}
      >
        {badge.label}
      </span>
    );

  if (badge.style === 'amber-soft')
    return (
      <span
        className={`${base} w-4 h-4`}
        style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}
      >
        {badge.label}
      </span>
    );

  return null;
}

function NavItem({ link }) {
  return (
    <NavLink
      to={link.path}
      className="block mx-2 mb-1"
      style={({ isActive }) =>
        isActive
          ? {
              borderLeft: `2px solid ${PAGE_ACCENT[link.path]}`,
              borderRadius: '0 12px 12px 0',
            }
          : {
              borderLeft: '2px solid transparent',
              borderRadius: '12px',
            }
      }
    >
      {({ isActive }) => (
        <div
          className="flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer"
          style={{
            background: isActive
              ? `rgba(34,197,94,0.08)`
              : 'transparent',
            color: isActive ? '#fff' : 'rgba(255,255,255,0.4)',
          }}
          onMouseEnter={(e) => {
            if (!isActive) {
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              e.currentTarget.style.color = '#fff';
            }
          }}
          onMouseLeave={(e) => {
            if (!isActive) {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'rgba(255,255,255,0.4)';
            }
          }}
        >
          {/* Left: icon + label */}
          <div className="flex items-center gap-3">
            <link.icon size={16} strokeWidth={1.8} className="shrink-0" />
            <span
              style={{
                fontSize: '13px',
                fontWeight: isActive ? 600 : 500,
              }}
            >
              {link.name}
            </span>
          </div>

          {/* Right: badge indicator */}
          <Badge badge={link.badge} />
        </div>
      )}
    </NavLink>
  );
}

function SidebarContent({ onClose }) {
  return (
    <aside
      className="flex flex-col h-full"
      style={{
        width: '200px',
        background: 'linear-gradient(180deg, #0F1612 0%, #0A1210 100%)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* ── Top Header ─────────────────────── */}
      <div style={{ padding: '24px 20px 0' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {/* Lightning icon in green circle */}
            <div
              className="flex items-center justify-center rounded-lg shrink-0"
              style={{
                width: '32px',
                height: '32px',
                background: '#162018',
                color: '#22c55e',
                fontSize: '14px',
              }}
            >
              ⚡
            </div>
            <span
              className="text-white font-bold ml-3"
              style={{ fontSize: '15px' }}
            >
              FinSight
            </span>
          </div>

          {/* Close button — mobile only */}
          <button
            onClick={onClose}
            className="lg:hidden flex items-center justify-center rounded-lg transition-colors"
            style={{
              color: 'rgba(255,255,255,0.4)',
              minWidth: '32px',
              minHeight: '32px',
            }}
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tagline */}
        <p
          className="uppercase tracking-widest ml-11 mt-0.5"
          style={{
            fontSize: '10px',
            color: 'rgba(255,255,255,0.35)',
            letterSpacing: '0.1em',
          }}
        >
          Financial Autopilot
        </p>
      </div>

      {/* ── Main Navigation ────────────────── */}
      <nav className="mt-8 flex-1 flex flex-col">
        {navLinks.map((link) => (
          <NavItem key={link.path} link={link} />
        ))}
      </nav>

      {/* ── Bottom: Settings + User Card ───── */}
      <div>
        {/* Settings link */}
        <NavLink
          to="/settings"
          className="block mx-2 mb-1"
          style={({ isActive }) =>
            isActive
              ? {
                  borderLeft: `2px solid ${PAGE_ACCENT['/settings']}`,
                  borderRadius: '0 12px 12px 0',
                }
              : {
                  borderLeft: '2px solid transparent',
                  borderRadius: '12px',
                }
          }
        >
          {({ isActive }) => (
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer"
              style={{
                background: isActive ? 'rgba(34,197,94,0.08)' : 'transparent',
                color: isActive ? '#fff' : 'rgba(255,255,255,0.4)',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                  e.currentTarget.style.color = '#fff';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.4)';
                }
              }}
            >
              <Settings size={16} strokeWidth={1.8} />
              <span style={{ fontSize: '13px', fontWeight: isActive ? 600 : 500 }}>
                Settings
              </span>
            </div>
          )}
        </NavLink>

        {/* Thin divider */}
        <div
          style={{
            height: '1px',
            background: 'rgba(255,255,255,0.06)',
            margin: '4px 0',
          }}
        />

        {/* User card */}
        <div
          className="flex items-center px-4 py-4"
        >
          {/* Avatar */}
          <div
            className="flex items-center justify-center rounded-full shrink-0 font-bold text-black text-sm"
            style={{ width: '36px', height: '36px', background: '#22c55e' }}
          >
            PS
          </div>

          <div className="ml-3 overflow-hidden">
            <div
              className="text-white font-medium truncate"
              style={{ fontSize: '13px' }}
            >
              Priya Sharma
            </div>
            <div
              className="uppercase tracking-wide truncate"
              style={{
                fontSize: '10px',
                color: '#22c55e',
                letterSpacing: '0.06em',
                marginTop: '2px',
              }}
            >
              Premium Plan
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();

  /* Close drawer on navigation (mobile) */
  useEffect(() => {
    onClose?.();
  }, [location.pathname]);

  /* Lock body scroll when drawer is open */
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <>
      {/* Desktop — fixed */}
      <div className="hidden lg:block fixed left-0 top-0 h-screen z-30" style={{ width: '200px' }}>
        <SidebarContent onClose={onClose} />
      </div>

      {/* Mobile drawer */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <div className="relative z-10 h-full shadow-2xl" style={{ width: '200px' }}>
            <SidebarContent onClose={onClose} />
          </div>
        </div>
      )}
    </>
  );
}
