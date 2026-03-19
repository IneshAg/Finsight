import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine, ReferenceArea,
  PieChart, Pie, Cell
} from 'recharts';
import {
  TrendingDown, AlertTriangle, Flame,
  CalendarDays, CreditCard, RefreshCw, Zap, X
} from 'lucide-react';
import { useSetuData } from '../hooks/useSetuData';
import { fetchMonthlyTrend, fetchRisk, fetchQuarter } from '../services/api';
import LoadingSkeleton from '../components/LoadingSkeleton';
import toast from 'react-hot-toast';

// ─── Risk Gauge ──────────────────────────────────────────────────────────────
function RiskGauge({ score, level }) {
  const map = {
    LOW:      { color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
    MODERATE: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    HIGH:     { color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  };
  const s = map[level] || map.LOW;
  const data = [
    { value: score, color: s.color },
    { value: 100 - score, color: '#162018' }
  ];
  return (
    <div style={{ position: 'relative', width: 220, height: 120, margin: '0 auto' }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data} cx="50%" cy="100%"
            startAngle={180} endAngle={0}
            innerRadius={70} outerRadius={90}
            dataKey="value" stroke="none"
          >
            {data.map((e, i) => <Cell key={i} fill={e.color} />)}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div style={{ position: 'absolute', bottom: 0, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: 36, fontWeight: 800, color: s.color, lineHeight: 1 }}>{score}</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4, letterSpacing: '0.05em' }}>
          RISK SCORE
        </div>
      </div>
    </div>
  );
}

function RiskPill({ level }) {
  const map = {
    LOW:      { color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
    MODERATE: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    HIGH:     { color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  };
  const s = map[level] ?? map.LOW;
  return (
    <span style={{
      border: `1px solid ${s.color}`,
      borderRadius: 999, padding: '2px 8px',
      fontSize: 10, fontWeight: 700,
      color: s.color, background: s.bg,
      letterSpacing: '0.05em',
    }}>
      {level.toUpperCase()}
    </span>
  );
}

function TodayLabel({ viewBox }) {
  if (!viewBox) return null;
  const { x, y } = viewBox;
  return (
    <g>
      <rect x={x - 26} y={y - 22} width={52} height={18} rx={6} fill="#ef4444" />
      <text x={x} y={y - 9} textAnchor="middle" fill="#fff" fontSize={10} fontWeight="bold">TODAY</text>
    </g>
  );
}

function RiskBanner({ type, title, subtitle, buttonText, onButtonClick }) {
  if (type === 'action') {
    return (
      <div style={{
        background: '#00E676',
        borderRadius: 16, padding: '18px 22px',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#0B0F0E', fontWeight: 600, fontSize: 16 }}>
            <Flame size={18} color="#0B0F0E" fill="#0B0F0E" />
            {title}
          </div>
          <p style={{ color: '#0B0F0E', fontSize: 14, marginTop: 4, fontWeight: 500 }}>
            {subtitle}
          </p>
        </div>
        {buttonText && (
          <button onClick={onButtonClick} style={{
            background: '#0B0F0E', color: '#00E676',
            padding: '10px 24px', borderRadius: 8, fontSize: 14, fontWeight: 600,
            border: 'none', cursor: 'pointer', flexShrink: 0,
          }}>
            {buttonText}
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{
      background: 'rgba(255,82,82,0.15)',
      borderLeft: '3px solid #FF5252',
      borderRadius: '0 16px 16px 0', padding: '18px 22px',
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#FF5252', fontWeight: 600, fontSize: 16 }}>
          <AlertTriangle size={18} />
          {title}
        </div>
        <p style={{ color: '#fff', fontSize: 14, marginTop: 4 }}>
          {subtitle}
        </p>
      </div>
      {buttonText && (
        <button onClick={onButtonClick} style={{
          background: 'rgba(255,82,82,0.1)', color: '#FF5252', border: '1px solid rgba(255,82,82,0.2)',
          padding: '10px 24px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', flexShrink: 0,
        }}>
          {buttonText}
        </button>
      )}
    </div>
  );
}

export default function RiskForecast() {
  const navigate = useNavigate();
  const {
    loading: ctxLoading, error: ctxError, needsConsent,
    currentBalance, upcomingBills
  } = useSetuData();

  const [trendData, setTrendData] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Quarter State
  const [quartersList, setQuartersList] = useState([]);
  const [selectedQuarterFn, setSelectedQuarterFn] = useState(null); 
  const [specificQuarterData, setSpecificQuarterData] = useState(null);

  // Modal State
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetAmount, setBudgetAmount] = useState('');
  
  // Weekly Breakdown Expand State
  const [expandedWeek, setExpandedWeek] = useState(null);

  useEffect(() => {
    if (needsConsent) {
      navigate('/connect');
      return;
    }
    Promise.all([
      fetchMonthlyTrend().then(r => r.data).catch(() => null),
      fetchRisk().then(r => r.data).catch(() => null)
    ]).then(([trend, risk]) => {
      setTrendData(trend);
      setRiskData(risk);
      if (trend && trend.quarterly) {
          setQuartersList(trend.quarterly);
          const curr = trend.quarterly.find(q => q.is_current);
          if (curr) setSelectedQuarterFn(curr.filename);
      }
      setLoading(false);
    });
  }, [needsConsent, navigate]);

  useEffect(() => {
     if (selectedQuarterFn) {
         fetchQuarter(selectedQuarterFn).then(res => {
             setSpecificQuarterData(res.data);
         }).catch(console.error);
     }
  }, [selectedQuarterFn]);

  if (ctxLoading || loading) return <div className="p-7"><LoadingSkeleton /></div>;
  if (ctxError)   return <div className="p-7" style={{ color: '#ef4444' }}>{ctxError}</div>;

  const fmt = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

  const selectedQObj = quartersList.find(q => q.filename === selectedQuarterFn);
  const isCurrentQ = selectedQObj?.is_current;
  const qSummary = selectedQObj?.summary || {};

  // ── Monthly trend chart processing ──────────────────────────────────────────
  let fullData = [];
  let todayMonthStr = '';
  
  if (trendData && trendData.monthly_spend) {
    const rawMonths = Object.keys(trendData.monthly_spend).sort();
    
    const formatLabel = (m) => {
        const d = new Date(m + "-01");
        return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    };

    const pastData = rawMonths.map((m) => {
        return {
            raw: m,
            month: formatLabel(m),
            past: trendData.monthly_spend[m],
            forecast: null
        };
    });

    const last3 = pastData.slice(-3).map(d => d.past);
    const avg3 = last3.length ? last3.reduce((a,b)=>a+b, 0) / last3.length : 50000;
    
    if (pastData.length > 0) {
        todayMonthStr = pastData[pastData.length - 1].month;
        pastData[pastData.length - 1].forecast = pastData[pastData.length - 1].past;
    }
    
    const lastDate = rawMonths.length ? new Date(rawMonths[rawMonths.length - 1] + "-01") : new Date();
    const futureData = [];
    for(let i=1; i<=3; i++) {
        const nextD = new Date(lastDate);
        nextD.setMonth(nextD.getMonth() + i);
        const mStr = nextD.toISOString().slice(0, 7);
        futureData.push({
            raw: mStr,
            month: formatLabel(mStr),
            past: null,
            forecast: avg3
        });
    }

    fullData = [...pastData, ...futureData];

    // Filter by selected quarter
    if (specificQuarterData) {
        const txMonths = new Set();
        specificQuarterData.transactions?.forEach(t => {
            txMonths.add(t.date.substring(0, 7));
        });
        if (!isCurrentQ) {
            fullData = fullData.filter(d => txMonths.has(d.raw));
            todayMonthStr = ''; // clear today marker if historical
        } else {
            fullData = fullData.filter(d => txMonths.has(d.raw) || (d.forecast && !d.past));
        }
    }
  }

  const risk = riskData || {
      score: 0, level: 'LOW', reason: 'No data',
      avg_monthly_spend: 0, current_quarter_spend: 0,
      spend_ratio_percent: 0, subscription_burn: 0, anomaly_count: 0
  };

  // ── Weekly Breakdown Logic ────────────────────────────────────────────────
  const getWeeklyBreakdown = () => {
    if (!specificQuarterData || !specificQuarterData.transactions) return [];
    const txs = [...specificQuarterData.transactions].sort((a,b) => new Date(a.date) - new Date(b.date));
    if (!txs.length) return [];
    
    const qStart = new Date(txs[0].date).getTime();
    const qEnd = new Date(txs[txs.length - 1].date).getTime();
    const totalDuration = qEnd - qStart;
    const weekDur = Math.max(totalDuration / 4, 1); // fallback to 1ms to avoid div by 0
    
    const weeks = [
        { week: 'W1', dates: 'Block 1', risk: 'LOW', amount: 0, txs: [] },
        { week: 'W2', dates: 'Block 2', risk: 'LOW', amount: 0, txs: [] },
        { week: 'W3', dates: 'Block 3', risk: 'LOW', amount: 0, txs: [] },
        { week: 'W4', dates: 'Block 4', risk: 'LOW', amount: 0, txs: [] }
    ];
    
    txs.forEach(tx => {
        if (tx.type === 'credit') return;
        if (tx.merchant.toLowerCase().includes('credit card bill')) return;
        
        const txTime = new Date(tx.date).getTime();
        let idx = Math.floor((txTime - qStart) / weekDur);
        if (idx >= 4) idx = 3;
        weeks[idx].txs.push(tx);
        weeks[idx].amount += tx.amount;
        if (weeks[idx].amount > 20000) weeks[idx].risk = 'HIGH';
        else if (weeks[idx].amount > 10000) weeks[idx].risk = 'MODERATE';
    });
    return weeks;
  };
  const weekCards = getWeeklyBreakdown();
  
  // Vertical offset per card per spec
  const OFFSETS = [0, 20, 0, 20];
  const highestRisk = weekCards.find(w => w.risk === 'HIGH') || weekCards[0];
  const totalUpcoming = upcomingBills?.reduce((a, b) => a + b.amount, 0) || 0;
  const predictedEnd  = currentBalance - totalUpcoming;

  return (
    <div className="p-4 sm:p-7 relative" style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1200 }}>

      {/* ── QUARTER SELECTOR ─────────────────────────────────────────────────── */}
      <div className="flex gap-3 mb-2 overflow-x-auto pb-2 scrollbar-none">
         {quartersList.map((q, idx) => {
             const isSelected = selectedQuarterFn === q.filename;
             const shortLabel = q.label.split(' - ').map(s=>s.substring(0,3)).join('-');
             return (
                 <button
                    key={idx}
                    onClick={() => setSelectedQuarterFn(q.filename)}
                    className={`px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-colors
                        ${isSelected ? 'bg-white text-black' : 'bg-gray-800 text-gray-400 border border-gray-700 hover:text-white'}
                    `}
                 >
                    [{q.quarter}: {shortLabel}] {q.is_current ? ' ✓ CURRENT' : ''}
                 </button>
             )
         })}
      </div>
      
      {/* Historical Banner */}
      {!isCurrentQ && selectedQObj && (
         <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl px-4 py-3 flex justify-between items-center flex-wrap gap-4">
             <div className="text-blue-400 text-sm font-medium">
                 Viewing historical data: {selectedQObj.label}
             </div>
             <button 
                onClick={() => {
                    const curr = quartersList.find(q => q.is_current);
                    if (curr) setSelectedQuarterFn(curr.filename);
                }}
                className="text-white text-sm font-bold underline hover:text-blue-200 uppercase tracking-widest shrink-0 transition-colors">
                 [← Back to Current Quarter]
             </button>
         </div>
      )}

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-white font-bold" style={{
          fontSize: 28, borderLeft: '3px solid #f59e0b',
          paddingLeft: 12, lineHeight: 1.2,
        }}>
          Risk Forecast
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 6, paddingLeft: 14 }}>
          Analyze your runway, catch cash crunches, and protect your budget.
        </p>
      </div>

      {/* ── STAT CARDS (Dynamic based on selected quarter) ────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        <div className="card-base">
          <div className="card-label">Total Spent ({isCurrentQ ? 'Up to Now' : selectedQObj?.quarter})</div>
          <div className="hero-number" style={{ marginTop: 8, fontSize: 36 }}>
            {fmt(qSummary.total_spent || risk.current_quarter_spend)}
          </div>
        </div>

        <div className={`card-base ${isCurrentQ ? 'card-amber' : ''}`}>
          <div className="card-label">{isCurrentQ ? 'Avg Monthly Spend' : 'Highest Spend Month'}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <div className="hero-number" style={{ fontSize: 36, color: isCurrentQ ? '#f59e0b' : '#fff' }}>
              {isCurrentQ ? fmt(risk.avg_monthly_spend) : qSummary.highest_spend_month}
            </div>
          </div>
        </div>

        <div className={`card-base ${isCurrentQ ? 'card-red' : ''}`}>
          <div className="card-label">{isCurrentQ ? 'Predicted End of Month' : 'Lowest Spend Month'}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <div className="hero-number" style={{ fontSize: 36, color: isCurrentQ ? '#ef4444' : '#fff' }}>
              {isCurrentQ ? fmt(predictedEnd) : qSummary.lowest_spend_month}
            </div>
          </div>
        </div>
      </div>

      {/* ── REAL RISK SCORE GAUGE AND BANNERS (Only show if current Q) ────── */}
      {isCurrentQ && (
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {/* Gauge Card */}
              <div className="card-base w-full md:w-[320px] flex flex-col justify-center items-center">
                 <RiskGauge score={risk.score} level={risk.level} />
                 <div className="mt-5 px-3 py-1 bg-white/5 rounded-full text-xs font-bold" 
                      style={{ color: risk.level === 'HIGH' ? '#ef4444' : risk.level === 'MODERATE' ? '#f59e0b' : '#22c55e' }}>
                     {risk.level} RISK
                 </div>
              </div>

              <div className="flex-1 flex flex-col gap-3 justify-center min-w-[300px]">
                <RiskBanner 
                  type={risk.level === 'HIGH' ? 'warning' : 'action'}
                  title={risk.level === 'HIGH' ? "High Risk Detected" : highestRisk?.amount > 0 ? `${highestRisk?.week} Cash Crunch Ahead` : "Status Update"}
                  subtitle={risk.reason}
                  buttonText={highestRisk?.amount > 0 ? "Add to Budget" : null}
                  onButtonClick={() => { setBudgetAmount(highestRisk.amount); setShowBudgetModal(true); }}
                />
                <div className="flex gap-4 mt-2">
                    <div className="bg-[#162018] border border-white/10 p-3 sm:p-4 rounded-xl flex-1">
                        <div className="text-xs text-white/40 mb-1">Spend Ratio</div>
                        <div className="text-sm sm:text-base text-white font-semibold">{risk.spend_ratio_percent}% of salary spent this quarter</div>
                    </div>
                    <div className="bg-[#162018] border border-white/10 p-3 sm:p-4 rounded-xl flex-1">
                        <div className="text-xs text-white/40 mb-1">Anomalies</div>
                        <div className="text-sm sm:text-base text-red-500 font-semibold">{risk.anomaly_count} unusual transactions detected</div>
                    </div>
                </div>
              </div>
          </div>
      )}

      {/* ── MONTHLY TREND CHART ─────────────────────────────────────────────── */}
      <div className="card-base">
        <h2 className="text-white font-semibold" style={{ fontSize: 15, marginBottom: 16 }}>
          Monthly Spending Trend {selectedQObj && `(${selectedQObj.label})`}
        </h2>
        <div style={{ height: 300, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={fullData} margin={{ top: 28, right: 16, left: 16, bottom: 0 }}>
              <defs>
                <linearGradient id="pastFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.08} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>

              <XAxis
                dataKey="month"
                axisLine={false} tickLine={false}
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
                dy={10}
              />
              <YAxis 
                domain={[20000, 90000]} 
                axisLine={false} tickLine={false}
                tickFormatter={(v) => `₹${v/1000}k`}
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
                dx={-10}
              />

              {/* Reference Areas */}
              <ReferenceArea 
                x1={fullData.find(d => d.raw.endsWith('-10'))?.month} 
                x2={fullData.find(d => d.raw.endsWith('-11'))?.month} 
                fill="#f97316" fillOpacity={0.15} 
                label={{ value: "FESTIVE SEASON", position: "insideTop", fill: "#f97316", fontSize: 10, fontWeight: "bold" }}
              />
              <ReferenceArea 
                x1={fullData.find(d => d.raw.endsWith('-02'))?.month} 
                x2={fullData.find(d => d.raw.endsWith('-02'))?.month} 
                fill="#3b82f6" fillOpacity={0.15} 
                label={{ value: "LOWEST SPEND", position: "insideTop", fill: "#3b82f6", fontSize: 10, fontWeight: "bold" }}
              />

              <Tooltip
                contentStyle={{
                  background: '#0F1612',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8, color: '#fff', fontSize: 12,
                }}
                formatter={(v) => [fmt(v), 'Amount']}
              />

              {/* TODAY vertical line */}
              {isCurrentQ && todayMonthStr && (
                <ReferenceLine
                  x={todayMonthStr}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  label={<TodayLabel />}
                />
              )}

              <Area
                type="monotone" dataKey="past"
                stroke="#22c55e" strokeWidth={2}
                fill="url(#pastFill)"
                dot={false} activeDot={{ r: 4, fill: '#22c55e' }}
                connectNulls={false} isAnimationActive={false}
              />
              {isCurrentQ && (
                  <Area
                    type="monotone" dataKey="forecast"
                    stroke="#22c55e" strokeWidth={2}
                    strokeDasharray="6 3"
                    fill="url(#forecastFill)"
                    dot={false} activeDot={{ r: 4, fill: '#22c55e' }}
                    connectNulls={false} isAnimationActive={false}
                  />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="section-divider"><span>weekly breakdown</span></div>

      {/* ── EXPANDABLE WEEKLY RISK CARDS ──────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, alignItems: 'flex-start' }}>
        {weekCards.map((w, idx) => {
          const isHigh = w.risk === 'HIGH';
          const isMod  = w.risk === 'MODERATE';
          const isExpanded = expandedWeek === idx;

          return (
            <div
              key={idx}
              onClick={() => setExpandedWeek(isExpanded ? null : idx)}
              style={{
                marginTop: isExpanded ? 0 : OFFSETS[idx],
                borderRadius: 16,
                padding: '18px 20px',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer',
                background: isHigh
                  ? 'rgba(239,68,68,0.06)'
                  : isMod
                    ? 'rgba(245,158,11,0.04)'
                    : '#0F1612',
                border: isHigh
                  ? '1px solid rgba(239,68,68,0.4)'
                  : isMod
                    ? '1px solid rgba(245,158,11,0.25)'
                    : '1px solid rgba(255,255,255,0.08)',
                boxShadow: isHigh
                  ? 'inset 0 0 40px rgba(239,68,68,0.04), 0 8px 32px rgba(239,68,68,0.08)'
                  : 'none',
              }}
            >
              {isHigh && (
                <div
                  className="animate-pulse"
                  style={{
                    position: 'absolute', top: 14, right: 14,
                    width: 8, height: 8, borderRadius: '50%',
                    background: '#ef4444',
                  }}
                />
              )}

              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <div className="card-label">{w.week}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
                    Quarter Block {idx + 1}
                  </div>
                </div>
                <RiskPill level={w.risk} />
              </div>

              <div style={{
                fontSize: isHigh ? 24 : 20,
                fontWeight: 700,
                color: isHigh ? '#ef4444' : isMod ? '#f59e0b' : '#fff',
                lineHeight: 1,
              }}>
                {fmt(w.amount)} spent
              </div>

              <div className="text-center mt-3 text-xs text-white/30 font-medium tracking-widest">{isExpanded ? 'COLLAPSE ▲' : 'CLICK TO EXPAND ▼'}</div>

              {isExpanded && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                     <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                        Transactions
                     </div>
                     {w.txs && w.txs.length > 0 ? w.txs.map((tx, tidx) => {
                         const isAno = riskData?.anomalies?.some(a => a.merchant === tx.merchant && Math.abs(a.amount - tx.amount) < 1) || qSummary?.notable_anomalies?.some(a => a.merchant === tx.merchant);
                         return (
                             <div key={tidx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                 <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span style={{ fontSize: 13, color: '#fff', fontWeight: 500 }}>{tx.merchant}</span>
                                        {isAno && <span style={{ fontSize: 10, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '1px 6px', borderRadius: 4, fontWeight: 'bold' }}>⚠</span>}
                                    </div>
                                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{new Date(tx.date).toLocaleDateString('en-IN', {day:'numeric', month:'short'})}</div>
                                 </div>
                                 <div style={{ fontSize: 13, fontWeight: 600, color: isAno ? '#ef4444' : '#fff' }}>
                                    ₹{tx.amount.toLocaleString('en-IN')}
                                 </div>
                             </div>
                         )
                     }) : (
                         <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>No transactions in this block.</div>
                     )}
                  </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── BUDGET MODAL ─────────────────────────────────────────────────── */}
      {showBudgetModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in">
            <div className="bg-[#1f2937] border border-gray-700 p-6 sm:p-8 rounded-2xl max-w-sm w-full mx-4 shadow-2xl relative">
                <button onClick={() => setShowBudgetModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
                    <X size={20} />
                </button>
                <h3 className="text-xl font-bold text-white mb-2">Add to Budget</h3>
                <p className="text-gray-400 text-sm mb-6 leading-relaxed">Confirm the amount you want to set aside to cover the anticipated cash crunch for {highestRisk?.week}.</p>
                
                <div className="relative mb-6">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">₹</span>
                    <input 
                       type="number" 
                       value={budgetAmount}
                       onChange={(e) => setBudgetAmount(e.target.value)}
                       className="w-full bg-[#111827] border border-gray-700 rounded-xl py-3 pl-8 pr-4 text-white font-bold text-lg focus:outline-none focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e]"
                    />
                </div>

                <div className="flex gap-3 justify-end mt-4">
                    <button onClick={() => setShowBudgetModal(false)} className="px-5 py-3 text-gray-400 hover:text-white font-medium transition-colors">Cancel</button>
                    <button onClick={() => {
                        toast.success(`₹${Number(budgetAmount).toLocaleString('en-IN')} set aside for ${highestRisk?.week}`, { 
                            icon: '✅', 
                            style: { borderRadius: '10px', background: '#22c55e', color: '#000', fontWeight: 'bold' } 
                        });
                        setShowBudgetModal(false);
                    }} className="px-6 py-3 bg-[#22c55e] hover:bg-[#16a34a] text-black font-bold rounded-xl transition-all active:scale-95 shadow-lg shadow-green-500/20">
                        Confirm
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}
