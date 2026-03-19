import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  LineChart, Line, ResponsiveContainer,
} from 'recharts';
import { useSetuData } from '../hooks/useSetuData';
import { fetchCardWinsSummary } from '../services/api';
import LoadingSkeleton from '../components/LoadingSkeleton';

// ─── SVG Budget Ring ──────────────────────────────────────────────────────────
function BudgetRing({ percent = 74, color = '#22c55e', size = 72 }) {
  const sw = 6;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <svg width={size} height={size} className="block shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#162018" strokeWidth={sw} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={sw}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}

// ─── Inline Sparkline (no axes) ───────────────────────────────────────────────
const SPARK = [{ v: 400 }, { v: 320 }, { v: 560 }, { v: 210 }, { v: 700 }, { v: 480 }, { v: 690 }];
function Sparkline() {
  return (
    <div style={{ height: 36, width: '100%', marginTop: 8 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={SPARK}>
          <Line type="monotone" dataKey="v" stroke="#22c55e" strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Mock Subscriptions (always shown) ───────────────────────────────────────
const mockSubscriptions = [
  { id: 1, name: 'Netflix Premium',   initial: 'N', color: '#ef4444', amount: '₹649',   cycle: 'Monthly', lastUsed: '2 days ago',         status: 'active'    },
  { id: 2, name: 'Spotify',           initial: 'S', color: '#22c55e', amount: '₹119',   cycle: 'Monthly', lastUsed: 'Not used in 24 days', status: 'forgotten' },
  { id: 3, name: 'Disney+ Hotstar',   initial: 'D', color: '#3b82f6', amount: '₹899',   cycle: 'Annual',  lastUsed: 'Yesterday',           status: 'active'    },
  { id: 4, name: 'Amazon Prime',      initial: 'A', color: '#0ea5e9', amount: '₹1,499', cycle: 'Annual',  lastUsed: '3 days ago',          status: 'active'    },
  { id: 5, name: 'Zomato Gold',       initial: 'Z', color: '#f97316', amount: '₹299',   cycle: '3 Months',lastUsed: 'Not used in 45 days', status: 'forgotten' },
  { id: 6, name: 'YouTube Premium',   initial: 'Y', color: '#dc2626', amount: '₹129',   cycle: 'Monthly', lastUsed: 'Daily active usage',  status: 'active'    },
];

// ─── Week Pill Timeline ───────────────────────────────────────────────────────
function WeekPills() {
  const pills = [
    {
      week: 'W1', dates: 'Jun 01–07', amount: '₹0 due',
      badge: 'LOW', badgeColor: '#22c55e', badgeBorder: '#22c55e',
      style: { background: '#0F1F12', border: '1px solid #1a3d1f' },
      amountStyle: { color: '#fff', fontSize: 20, fontWeight: 700, marginTop: 8 },
      risk: 'low',
    },
    {
      week: 'W2', dates: 'Jun 08–14', amount: '₹649 due',
      badge: 'LOW', badgeColor: '#22c55e', badgeBorder: '#22c55e',
      style: { background: '#0F1F12', border: '1px solid #1a3d1f' },
      amountStyle: { color: '#fff', fontSize: 20, fontWeight: 700, marginTop: 8 },
      risk: 'low',
    },
    {
      week: 'W3', dates: 'Jun 15–21', amount: '₹4,848 due',
      badge: 'HIGH RISK', badgeColor: '#ef4444', badgeBorder: 'transparent',
      style: {
        background: 'rgba(239,68,68,0.08)',
        border: '1px solid #ef4444',
        boxShadow: 'inset 0 0 30px rgba(239,68,68,0.05), 0 0 20px rgba(239,68,68,0.1)',
      },
      amountStyle: { color: '#ef4444', fontSize: 24, fontWeight: 700, marginTop: 8 },
      risk: 'high',
    },
    {
      week: 'W4', dates: 'Jun 22–30', amount: '₹1,200 due',
      badge: 'MODERATE', badgeColor: '#f59e0b', badgeBorder: 'transparent',
      style: { background: '#1a1508', border: '1px solid #3d2f0a' },
      amountStyle: { color: '#fff', fontSize: 20, fontWeight: 700, marginTop: 8 },
      risk: 'moderate',
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', gap: 16 }}>
        {pills.map((p) => (
          <div
            key={p.week}
            style={{
              flex: 1,
              borderRadius: 20,
              padding: '20px 24px',
              position: 'relative',
              overflow: 'hidden',
              ...p.style,
            }}
          >
            {/* Pulsing dot for HIGH RISK */}
            {p.risk === 'high' && (
              <div
                className="animate-pulse"
                style={{
                  position: 'absolute', top: 12, right: 12,
                  width: 8, height: 8, borderRadius: '50%',
                  background: '#ef4444',
                }}
              />
            )}
            <div className="card-label">{p.week}</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 4, letterSpacing: '0.05em' }}>
              {p.dates}
            </div>
            <div style={p.amountStyle}>{p.amount}</div>
            {/* Badge */}
            <div style={{ marginTop: 8 }}>
              <span style={{
                fontSize: 10, borderRadius: 999,
                padding: p.risk === 'high' ? '4px 12px' : '2px 8px',
                background: p.risk === 'high'
                  ? 'rgba(239,68,68,0.15)'
                  : p.risk === 'moderate'
                    ? 'rgba(245,158,11,0.15)'
                    : 'transparent',
                color: p.badgeColor,
                border: p.risk === 'low' ? `1px solid ${p.badgeBorder}` : 'none',
                fontWeight: 600,
              }}>
                {p.badge}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Warning Banner — W3 always shown as HIGH */}
      <div style={{
        marginTop: 16,
        background: 'rgba(239,68,68,0.06)',
        border: '1px solid rgba(239,68,68,0.2)',
        borderRadius: 16,
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>⚠</span>
          <span style={{ color: '#fca5a5', fontWeight: 600, fontSize: 13 }}>
            W3 Warning: Cash Crunch Peak
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['Netflix ₹649', 'Gym EMI ₹999', 'Credit Card ₹3,200'].map((b) => (
            <span key={b} style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 999, padding: '4px 12px',
              fontSize: 12, color: '#fff',
            }}>
              {b}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { search } = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('active');
  const [cardWinsSummary, setCardWinsSummary] = useState(null);
  const [expandedAnomalyIndex, setExpandedAnomalyIndex] = useState(null);

  useEffect(() => {
    let mounted = true;
    fetchCardWinsSummary().then(res => {
      if(mounted && res.data) setCardWinsSummary(res.data);
    }).catch(err => console.error("Failed to fetch card wins summary", err));
    return () => mounted = false;
  }, []);

  const {
    loading, error, needsConsent,
    totalSpent, budgetHealth,
    subscriptions, upcomingBills,
    cardWins, anomalies,
  } = useSetuData();

  useEffect(() => {
    if (needsConsent) navigate('/connect');
  }, [needsConsent, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(search);
    if (params.get('consent') === 'success') {
      toast.success('Bank connected! Loading your data…', {
        icon: '⚡',
        style: { borderRadius: '10px', background: '#22c55e', color: '#000' },
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [search]);

  if (loading) return <div className="p-7"><LoadingSkeleton /></div>;

  if (error) {
    return (
      <div className="p-7 h-full flex items-center justify-center">
        <div className="text-center card-base w-full max-w-sm">
          <div style={{ color: '#ef4444', fontSize: 48, marginBottom: 16 }}>⚠</div>
          <h2 className="text-xl font-bold text-white mb-2">Data Loading Failed</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>{error}</p>
          <button className="btn-primary w-full" onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ── Derived values ────────────────────────────────────────────────────────
  const fmt = (n) => `₹${Number(n).toLocaleString('en-IN')}`;
  const health = 74; // Using the spec value; falls back to real: Math.round(budgetHealth)
  const upcomingTotal = upcomingBills?.reduce((a, b) => a + b.amount, 0) || 4200;
  const totalSubSpend = 3840;
  const forgottenCount = 2;

  // Always use mock subs but merge status filter with them
  const displaySubs = mockSubscriptions.filter((s) => {
    if (activeTab === 'active')    return s.status === 'active';
    if (activeTab === 'forgotten') return s.status === 'forgotten';
    if (activeTab === 'unused')    return s.status === 'unused';
    return true;
  });

  const totalMissed = cardWinsSummary?.total_missed || 5389; // Unified source fallback
  const lastUpdated = cardWinsSummary?.last_updated ? new Date(cardWinsSummary.last_updated).toLocaleString() : 'Just now';

  const cardWinTransactions = cardWinsSummary?.top_missed_items?.length > 0
    ? cardWinsSummary.top_missed_items.slice(0, 4)
    : [
        { merchant: 'Swiggy',  card_used: 'SBI SimplyClick',    missed: 120 },
        { merchant: 'Amazon',  card_used: 'HDFC Regalia',        missed: 85 },
        { merchant: 'Uber',    card_used: 'ICICI Amazon Pay',    missed: 60 },
        { merchant: 'Zomato',  card_used: 'Amex MRCC',           missed: 75 },
      ];

  const badges = [
    { icon: '🛡️', name: 'Saver',      earned: true,  bg: '#1e3a5f', iconColor: '#60a5fa' },
    { icon: '🏅', name: 'Titan',      earned: true,  bg: '#2d2d2d', iconColor: '#9ca3af' },
    { icon: '⚡', name: 'Fast Start', earned: true,  bg: '#3d1f00', iconColor: '#f97316' },
    { icon: '📦', name: 'Hoarder',    earned: false, bg: '#0F1612', iconColor: '#4b5563' },
    { icon: '🎯', name: 'Sniper',     earned: false, bg: '#0F1612', iconColor: '#4b5563' },
    { icon: '👑', name: 'King',       earned: false, bg: '#0F1612', iconColor: '#4b5563' },
  ];

  return (
    <div className="p-7" style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1200 }}>
      {/* Dynamic styles for this page */}
      <style>{`
        .subs-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .subs-scrollbar::-webkit-scrollbar-track {
          background: #1E2E22;
          border-radius: 999px;
        }
        .subs-scrollbar::-webkit-scrollbar-thumb {
          background: #00E676;
          border-radius: 999px;
        }
      `}</style>


      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="text-white font-bold" style={{
            fontSize: 28, borderLeft: '3px solid #22c55e',
            paddingLeft: 12, lineHeight: 1.2,
          }}>
            Overview
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 6, paddingLeft: 14 }}>
            Here's what's happening with your money right now.
          </p>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 12, color: 'rgba(255,255,255,0.4)',
          background: '#0F1612', borderRadius: 10,
          border: '1px solid rgba(255,255,255,0.08)',
          padding: '8px 14px',
        }}>
          <div className="animate-pulse" style={{
            width: 8, height: 8, borderRadius: '50%', background: '#22c55e',
          }} />
          Live Sync Active
        </div>
      </div>

      {/* ── STAT CARDS ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>

        {/* Budget Health */}
        <div className="card-base card-green fade-up" style={{ animationDelay: '0ms' }}>
          <div className="card-label">Budget Health</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
            <div>
              <div className="hero-number">{health}</div>
              <div style={{ fontSize: 13, color: '#22c55e', marginTop: 6 }}>↑ 3 points from last month</div>
            </div>
            <BudgetRing percent={health} color="#22c55e" size={72} />
          </div>
        </div>

        {/* Total Spent */}
        <div className="card-base fade-up" style={{ animationDelay: '100ms' }}>
          <div className="card-label">Total Spent</div>
          <div className="hero-number" style={{ marginTop: 8, fontSize: 36 }}>₹24,500</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>₹816 per day average</div>
          <Sparkline />
        </div>

        {/* Upcoming Bills */}
        <div className="card-base card-amber fade-up" style={{ animationDelay: '200ms' }}>
          <div className="card-label">Upcoming Bills</div>
          <div className="hero-number" style={{ marginTop: 8, fontSize: 36 }}>₹4,200</div>
          <div style={{ fontSize: 13, color: '#f59e0b', marginTop: 6 }}>3 bills due this week</div>
        </div>

        {/* Active Subscriptions */}
        <div className="card-base card-red fade-up" style={{ animationDelay: '300ms' }}>
          <div className="card-label">Active Subscriptions</div>
          <div className="hero-number" style={{ marginTop: 8, fontSize: 36 }}>₹3,840</div>
          <div style={{ fontSize: 13, color: '#ef4444', marginTop: 6 }}>2 forgotten subscriptions</div>
        </div>
      </div>

      {/* ── SECTION DIVIDER ─────────────────────────────────────────────────── */}
      <div className="section-divider"><span>this month</span></div>

      {/* ── MIDDLE ROW: Weekly Timeline + Card Wins ──────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'start' }}>

        {/* Weekly Pill Timeline */}
        <div className="card-base" style={{ flex: 1 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: 20,
          }}>
            <h3 className="text-white font-semibold" style={{ fontSize: 15 }}>Monthly Risk Forecast</h3>
            <span style={{
              fontSize: 11, color: 'rgba(255,255,255,0.3)',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 8, padding: '4px 10px',
            }}>June 2025</span>
          </div>
          <WeekPills />
        </div>

        {/* Card Wins */}
        <div className="card-base card-red" style={{ width: 280, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span className="text-white font-semibold" style={{ fontSize: 15 }}>Card Wins</span>
            <span style={{
              background: 'rgba(255,255,255,0.06)',
              borderRadius: 999, padding: '3px 10px',
              fontSize: 11, color: 'rgba(255,255,255,0.4)',
            }}>Last synced: {lastUpdated}</span>
          </div>

          {/* Hero number with decorative arc */}
          <div style={{ position: 'relative', marginBottom: 4 }}>
            <div
              className="hero-number"
              style={{ color: '#ef4444', fontSize: 44 }}
            >
              ₹{totalMissed.toLocaleString('en-IN')}
            </div>
            {/* Red arc decoration */}
            <div style={{
              position: 'absolute', top: -16, right: -16,
              width: 80, height: 80, borderRadius: '50%',
              border: '2px solid rgba(239,68,68,0.15)',
              pointerEvents: 'none',
            }} />
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>Cashback Missed</p>

          {/* Transaction rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {cardWinTransactions.map((tx, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 0',
                borderTop: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              }}>
                <div>
                  <div style={{ color: '#fff', fontSize: 13, fontWeight: 500 }}>{tx.merchant}</div>
                  <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>{tx.card_used || tx.ideal_card}</div>
                </div>
                <div style={{ color: '#ef4444', fontSize: 13, fontWeight: 600 }}>
                  -{fmt(tx.missed)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── BOTTOM ROW: Subscriptions + Challenges ───────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, paddingBottom: 24 }}>

        {/* Subscriptions */}
        <div className="card-base" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span className="text-white font-semibold" style={{ fontSize: 15 }}>Subscriptions</span>
            <button 
              onClick={() => navigate('/subscriptions')}
              style={{ color: '#22c55e', fontSize: 13, fontWeight: 500, cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
            >
              Manage
            </button>
          </div>
          <div className="text-white" style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>
            Total ₹3,594/mo
          </div>

          {/* Tab pills */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {[
              { id: 'active', label: 'Active' },
              { id: 'forgotten', label: 'Forgotten' },
              { id: 'unused', label: 'Unused' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '5px 14px', borderRadius: 999, fontSize: 12,
                  fontWeight: 500, cursor: 'pointer', transition: 'all 150ms',
                  background: activeTab === tab.id ? '#22c55e' : 'transparent',
                  color: activeTab === tab.id ? '#000' : 'rgba(255,255,255,0.4)',
                  border: activeTab === tab.id ? 'none' : '1px solid rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                {tab.label}
                {tab.id === 'forgotten' && (
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                )}
              </button>
            ))}
          </div>

          {/* Sub list */}
          <div className="subs-scrollbar" style={{ display: 'flex', flexDirection: 'column', maxHeight: 320, overflowY: 'auto', paddingRight: 8, marginRight: -8 }}>
            {displaySubs.map((sub, i) => (
              <div key={sub.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 0',
                borderTop: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              }}>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%',
                    background: sub.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, color: '#fff', fontSize: 14, flexShrink: 0,
                  }}>
                    {sub.initial}
                  </div>
                  {sub.status === 'forgotten' && (
                    <div style={{
                      position: 'absolute', top: -2, right: -2,
                      width: 10, height: 10, borderRadius: '50%',
                      background: '#ef4444', border: '2px solid #0F1612'
                    }} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#fff', fontSize: 13, fontWeight: 500 }}>{sub.name}</div>
                  <div style={{
                    fontSize: 11,
                    color: sub.lastUsed.startsWith('Not used')
                      ? '#ef4444'
                      : 'rgba(255,255,255,0.35)',
                    marginTop: 2,
                  }}>
                    {sub.lastUsed}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>{sub.amount}</div>
                  <div style={{ color: '#22c55e', fontSize: 11, marginTop: 2 }}>{sub.cycle}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Saving Challenges */}
        <div className="card-base">
          {/* Streak row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span className="text-white font-bold" style={{ fontSize: 20 }}>12 Day Streak</span>
            <span style={{ fontSize: 24 }}>🔥</span>
          </div>

          {/* Progress bar */}
          <div style={{
            background: 'rgba(255,255,255,0.08)', borderRadius: 999,
            height: 6, overflow: 'hidden', marginBottom: 6,
          }}>
            <div
              className="progress-bar-animated"
              style={{
                '--fill-width': '80%',
                height: '100%', background: '#22c55e',
                borderRadius: 999, width: '0%',
              }}
            />
          </div>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 24 }}>
            3 days until next badge
          </p>

          {/* Badges */}
          <p className="text-white font-semibold" style={{ marginBottom: 12 }}>Your Badges</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            {badges.map((badge, i) => (
              <div
                key={i}
                style={{
                  background: badge.bg,
                  borderRadius: 14, padding: '14px 10px',
                  textAlign: 'center',
                  border: badge.earned
                    ? '1px solid rgba(251,191,36,0.3)'
                    : '1px solid rgba(255,255,255,0.06)',
                  boxShadow: badge.earned
                    ? '0 0 16px rgba(251,191,36,0.05)'
                    : 'none',
                  opacity: badge.earned ? 1 : 0.35,
                  position: 'relative',
                }}
              >
                {badge.earned && (
                  <div style={{ position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)' }}>
                    <span style={{
                      background: '#78350f', color: '#fbbf24',
                      fontSize: 9, fontWeight: 700,
                      borderRadius: 999, padding: '2px 8px',
                      letterSpacing: '0.05em', whiteSpace: 'nowrap',
                    }}>
                      EARNED
                    </span>
                  </div>
                )}
                <div style={{ fontSize: 24, marginBottom: 6 }}>{badge.icon}</div>
                <div style={{ color: '#fff', fontSize: 11, fontWeight: 500 }}>{badge.name}</div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── ANOMALIES ─────────────────────────────────────────────────── */}
      {anomalies && anomalies.length > 0 && (
        <>
          <div className="section-divider"><span>recent anomalies</span></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, paddingBottom: 24 }}>
            {anomalies.map((ano, idx) => {
              const isExpanded = expandedAnomalyIndex === idx;
              return (
                <div key={idx} 
                  onClick={() => setExpandedAnomalyIndex(isExpanded ? null : idx)}
                  className="card-base" 
                  style={{ cursor: 'pointer', transition: 'all 0.2s', border: isExpanded ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 18 }}>⚠</span>
                      </div>
                      <div>
                        <div style={{ color: '#fff', fontSize: 15, fontWeight: 600 }}>{ano.merchant}</div>
                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 }}>{new Date(ano.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                      </div>
                    </div>
                    <div style={{ color: '#ef4444', fontSize: 18, fontWeight: 700 }}>
                      ₹{ano.amount.toLocaleString('en-IN')}
                    </div>
                  </div>
                  {isExpanded && (
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
                      <p style={{ marginBottom: 8 }}><strong style={{ color: '#fff' }}>Why it was flagged:</strong> This transaction's amount is significantly higher than your typical spend at this merchant.</p>
                      <p style={{ background: 'rgba(255,255,255,0.03)', padding: 8, borderRadius: 8 }}>
                        Expected normal range: <span style={{ color: '#22c55e', fontWeight: 600 }}>{ano.expected_range}</span>
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
