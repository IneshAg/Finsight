import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { WalletCards, Plus, ArrowRight } from 'lucide-react';
import { useSetuData } from '../hooks/useSetuData';
import { fetchCardWinsSummary } from '../services/api';
import LoadingSkeleton from '../components/LoadingSkeleton';

// ─── Mock data — always shown ─────────────────────────────────────────────────
const mockMissedWins = [
  {
    id: 1,
    merchant: 'Swiggy',
    initial: 'S',
    color: '#f97316',
    amountSpent: '₹1,500',
    missed: '-₹45',
    cardUsed: 'SBI SimplyClick',
    recommendation: 'Use HDFC Regalia',
    benefit: 'to earn 5x reward points',
    category: 'Food & Dining',
  },
  {
    id: 2,
    merchant: 'Zomato',
    initial: 'Z',
    color: '#ef4444',
    amountSpent: '₹2,100',
    missed: '-₹82',
    cardUsed: 'HDFC Regalia',
    recommendation: 'Use HSBC Cashback',
    benefit: 'for 10% instant cashback',
    category: 'Food & Dining',
  },
  {
    id: 3,
    merchant: 'Myntra',
    initial: 'M',
    color: '#ec4899',
    amountSpent: '₹4,000',
    missed: '-₹120',
    cardUsed: 'ICICI Amazon Pay',
    recommendation: 'Use Kotak Myntra Card',
    benefit: 'for 7.5% instant discount',
    category: 'Shopping',
  },
  {
    id: 4,
    merchant: 'Uber',
    initial: 'U',
    color: '#6b7280',
    amountSpent: '₹950',
    missed: '-₹38',
    cardUsed: 'SBI SimplyClick',
    recommendation: 'Use Amex Gold Card',
    benefit: 'for 5x MR points on travel',
    category: 'Travel',
  },
];

// ─── Default Mock properties ───────────────────────────────────────────────────
const FALLBACK_TOTAL_MISSED = 5389;

const userCards = [
  { name: 'HDFC Regalia',     tag: 'TRAVEL',     color: 'bg-blue-500/10 text-blue-500 border-blue-500/20'   },
  { name: 'SBI SimplyClick',  tag: 'SHOPPING',   color: 'bg-sky-500/10 text-sky-400 border-sky-500/20'      },
  { name: 'ICICI Amazon Pay', tag: 'E-COMMERCE', color: 'bg-gray-300/10 text-gray-300 border-gray-400/20'   },
  { name: 'Amex MRCC',        tag: 'REWARDS',    color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
];

export default function CardWins() {
  const navigate = useNavigate();
  const { loading, error, needsConsent } = useSetuData();
  const [summaryData, setSummaryData] = useState(null);

  useEffect(() => {
    let mounted = true;
    fetchCardWinsSummary().then(res => {
      if(mounted && res.data) setSummaryData(res.data);
    }).catch(err => console.error("Failed to fetch card wins summary", err));
    return () => mounted = false;
  }, []);

  if (needsConsent) { navigate('/connect'); return null; }
  if (loading) return <div className="p-8"><LoadingSkeleton /></div>;
  const totalMissed = summaryData?.total_missed || FALLBACK_TOTAL_MISSED;
  const lastUpdated = summaryData?.last_updated ? new Date(summaryData.last_updated).toLocaleString() : 'Just now';
  
  // Dynamic Efficiency based on missed amounts
  const EFFICIENCY = summaryData ? Math.max(0, 100 - Math.min(100, Math.floor((totalMissed / 10000) * 100))) : 68;
  const efficiencyData = [
    { name: 'Efficient', value: EFFICIENCY,       color: '#22c55e' },
    { name: 'Missed',    value: 100 - EFFICIENCY, color: '#ef4444' },
  ];

  // Dynamic lists mapping API keys to display formats
  const displayMissedWins = summaryData?.top_missed_items?.length > 0 
    ? summaryData.top_missed_items.map((t, idx) => ({
        id: idx,
        merchant: t.merchant,
        initial: t.merchant.charAt(0).toUpperCase(),
        color: ['#f97316', '#ef4444', '#ec4899', '#6b7280', '#22c55e'][idx % 5],
        amountSpent: `₹${t.amount_spent}`,
        missed: `-₹${t.missed}`,
        cardUsed: t.card_used,
        recommendation: `Use ${t.recommended_card}`,
        benefit: t.benefit,
        category: t.category,
      })) 
    : mockMissedWins;

  const displayCategories = summaryData?.categories_missed && Object.keys(summaryData.categories_missed).length > 0
    ? Object.entries(summaryData.categories_missed).map(([name, amount]) => ({
        name,
        amount,
        pct: Math.min(100, Math.floor((amount / totalMissed) * 100))
      })).sort((a,b) => b.amount - a.amount).slice(0, 4)
    : [
        { name: 'Food & Dining', amount: 127, pct: 80 },
        { name: 'Shopping',      amount: 92,  pct: 60 },
        { name: 'Travel',        amount: 65,  pct: 45 },
        { name: 'Groceries',     amount: 38,  pct: 25 },
      ];

  if (error)   return <div className="p-8" style={{ color: '#ef4444' }}>{error}</div>;

  return (
    <div className="p-7" style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1200 }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <h1 className="text-white font-bold" style={{
            fontSize: 28, borderLeft: '3px solid #ef4444',
            paddingLeft: 12, lineHeight: 1.2,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <WalletCards size={24} style={{ color: '#ef4444' }} />
            Card Wins
          </h1>
          <span style={{
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 999, padding: '4px 12px',
            fontSize: 11, color: 'rgba(255,255,255,0.4)',
          }}>Last synced: {lastUpdated}</span>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 6, paddingLeft: 14 }}>
          Optimize your wallet to maximize cashback and rewards.
        </p>
      </div>

      {/* ── Hero Banner ─────────────────────────────────────────────────────── */}
      <div className="card-base" style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', gap: 32, flexWrap: 'wrap',
      }}>
        {/* Left */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <div className="hero-number" style={{ color: '#ef4444' }}>₹{totalMissed.toLocaleString('en-IN')}</div>
          <div className="card-label" style={{ marginTop: 8, marginBottom: 16 }}>missed this month</div>
          <p style={{ color: '#fff', fontSize: 15, lineHeight: 1.6, fontWeight: 500 }}>
            You're leaving money on the table by using the wrong cards for your daily spends.
          </p>
        </div>

        {/* Donut */}
        <div style={{ position: 'relative', width: 180, height: 180, flexShrink: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={efficiencyData}
                cx="50%" cy="50%"
                innerRadius={55} outerRadius={75}
                paddingAngle={2} dataKey="value" stroke="none"
              >
                {efficiencyData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            <span className="card-label" style={{ marginBottom: 4 }}>Efficiency</span>
            <span style={{ fontSize: 28, fontWeight: 700, color: '#fff' }}>{EFFICIENCY}%</span>
          </div>
        </div>
      </div>

      {/* ── Main Grid ───────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'start' }}>

        {/* Left: Missed Wins List */}
        <div>
          <h2 className="text-white font-bold" style={{ fontSize: 18, marginBottom: 16 }}>
            Recent Missed Wins
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {displayMissedWins.map((tx) => (
              <div key={tx.id} className="card-base" style={{ padding: '18px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  {/* Merchant */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%',
                      background: tx.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, color: '#fff', fontSize: 15, flexShrink: 0,
                    }}>
                      {tx.initial}
                    </div>
                    <div>
                      <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{tx.merchant}</div>
                      <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 2 }}>
                        Spent {tx.amountSpent} · via {tx.cardUsed}
                      </div>
                    </div>
                  </div>

                  {/* Missed pill */}
                  <div style={{
                    color: '#ef4444', fontWeight: 700,
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: 999, padding: '4px 12px', fontSize: 13,
                    flexShrink: 0,
                  }}>
                    {tx.missed} missed
                  </div>
                </div>

                {/* Recommendation bar */}
                <div style={{
                  background: 'rgba(34,197,94,0.06)',
                  border: '1px solid rgba(34,197,94,0.15)',
                  borderRadius: 10, padding: '10px 14px',
                }}>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                    {tx.recommendation}{' '}
                    <span style={{ color: '#fff', fontWeight: 600 }}>{tx.benefit}</span>.
                  </span>
                </div>
              </div>
            ))}
          </div>

          <button className="btn-primary" style={{
            width: '100%', marginTop: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            Apply for Recommended Cards <ArrowRight size={16} />
          </button>
        </div>

        {/* Right: Cards + Categories */}
        <div style={{ width: 300, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Your Cards */}
          <div className="card-base">
            <h2 className="text-white font-bold" style={{ fontSize: 15, marginBottom: 16 }}>Your Cards</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {userCards.map((card, idx) => (
                <div key={idx} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 12px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <span style={{ color: '#fff', fontSize: 13, fontWeight: 500 }}>{card.name}</span>
                  <span className={`text-[10px] font-bold px-2 py-1 uppercase rounded border ${card.color}`}>
                    {card.tag}
                  </span>
                </div>
              ))}
              <button style={{
                width: '100%', padding: '12px',
                border: '1px dashed rgba(255,255,255,0.15)',
                borderRadius: 10, cursor: 'pointer',
                background: 'transparent',
                color: 'rgba(255,255,255,0.35)',
                fontSize: 13, display: 'flex',
                alignItems: 'center', justifyContent: 'center', gap: 6,
                transition: 'all 150ms',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; }}
              >
                <Plus size={14} /> Add New Card
              </button>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="card-base">
            <h2 className="text-white font-bold" style={{ fontSize: 15, marginBottom: 18 }}>
              Top Categories Missing Cashback
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {displayCategories.map((cat, idx) => (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: '#fff', fontSize: 13, fontWeight: 500 }}>{cat.name}</span>
                    <span style={{ color: '#ef4444', fontSize: 13, fontWeight: 700 }}>₹{cat.amount}</span>
                  </div>
                  <div style={{
                    width: '100%', height: 6,
                    background: 'rgba(255,255,255,0.06)',
                    borderRadius: 999, overflow: 'hidden',
                  }}>
                    <div
                      className="progress-bar-animated"
                      style={{
                        '--fill-width': `${cat.pct}%`,
                        height: '100%',
                        background: '#ef4444',
                        borderRadius: 999,
                        width: '0%',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
