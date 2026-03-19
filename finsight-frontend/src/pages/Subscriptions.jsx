import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Search, PenLine, X, AlertTriangle } from 'lucide-react';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { cancelSubscriptions, fetchSubscriptions } from '../services/api';

export default function Subscriptions() {
  const navigate = useNavigate();
  
  const [subsState, setSubsState] = useState([]);
  const [totalMonthlySpend, setTotalMonthlySpend] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [activeTab, setActiveTab] = useState('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSmartModal, setShowSmartModal] = useState(true);

  useEffect(() => {
    const fallbackSubs = [
      { id: "1", name: "Netflix Premium", amount: 649, billing_cycle: "Monthly", status: "active", last_used: "2 days ago", next_due: "12 Oct", days_since_used: 2 },
      { id: "2", name: "Spotify", amount: 119, billing_cycle: "Monthly", status: "forgotten", last_used: "45 days ago", next_due: "15 Oct", days_since_used: 45 },
      { id: "3", name: "Disney+ Hotstar", amount: 899, billing_cycle: "Annual", status: "active", last_used: "yesterday", next_due: "02 Nov", days_since_used: 1 },
      { id: "4", name: "Amazon Prime", amount: 1499, billing_cycle: "Annual", status: "active", last_used: "3 days ago", next_due: "24 Dec", days_since_used: 3 },
      { id: "5", name: "Zomato Gold", amount: 299, billing_cycle: "Monthly", status: "forgotten", last_used: "24 days ago", next_due: "18 Oct", days_since_used: 24 },
      { id: "6", name: "YouTube Premium", amount: 129, billing_cycle: "Monthly", status: "active", last_used: "daily usage", next_due: "20 Oct", days_since_used: 0 }
    ];

    let mounted = true;
    const loadSubs = async () => {
      try {
        setLoading(true);
        const res = await fetchSubscriptions();
        let apiSubs = res.data.subscriptions;
        
        let finalSubs, finalTotal;
        if (!apiSubs || apiSubs.length === 0) {
            finalSubs = fallbackSubs;
            finalTotal = fallbackSubs.reduce((sum, s) => sum + s.amount, 0);
            if (mounted) setError("Warning: No subscriptions found natively on DB. Showing fallback mock data.");
        } else {
            finalSubs = apiSubs.map((s, idx) => ({
              id: s.id || String(idx),
              name: s.merchant || 'Unknown',
              amount: s.avg ? Math.round(s.avg) : 0,
              billing_cycle: 'Monthly',
              status: s.status || 'active',
              last_used: s.last_used_date || 'Unknown',
              next_due: s.next_billing_date || 'Unknown',
              days_since_used: s.days_since_used || 0
            }));
            finalTotal = res.data.total_monthly || 0;
            if (mounted) setError(null);
        }

        if (mounted) {
            setSubsState(finalSubs);
            setTotalMonthlySpend(finalTotal);
            setLoading(false);
        }
      } catch (err) {
        console.error("Failed to fetch subscriptions:", err);
        if (mounted) {
            setError(err.response?.data?.detail || err.message || "Failed to load subscriptions properly.");
            setSubsState(fallbackSubs);
            setTotalMonthlySpend(fallbackSubs.reduce((sum, s) => sum + s.amount, 0));
            setLoading(false);
        }
      }
    };
    loadSubs();
    return () => mounted = false;
  }, []);

  if (loading) return <div className="p-8"><LoadingSkeleton /></div>;

  const formatCurrency = (amount) => `₹${amount.toLocaleString('en-IN')}`;

  // 1. Calculations metrics
  const wastedSubs = subsState.filter(s => s.status === 'forgotten' || s.status === 'unused');
  const potentialSavings = wastedSubs.reduce((sum, s) => sum + s.amount, 0);
  const hasForgotten = subsState.some(s => s.status === 'forgotten');
  
  // 2. Tab Filtering + Search Filtering
  const displayedSubs = subsState.filter(s => {
    // 1. Tab Match
    let tabMatch = false;
    if (activeTab === 'active') tabMatch = s.status === 'active';
    if (activeTab === 'forgotten') tabMatch = s.status === 'forgotten';
    if (activeTab === 'unused') tabMatch = s.status === 'unused';
    
    // 2. Search match
    const searchMatch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    return tabMatch && searchMatch;
  });

  // 3. Avatar Color Generator
  const getAvatarColor = (name) => {
    const defaultColors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 
      'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500'
    ];
    let num = 0;
    for (let i = 0; i < name.length; i++) {
        num += name.charCodeAt(i);
    }
    return defaultColors[num % defaultColors.length];
  };

  // 4. Smart Recommendation cancel action
  const handleSmartCancel = async () => {
    const namesToCancel = wastedSubs.map(s => s.name);
    
    try {
      await cancelSubscriptions(namesToCancel);
      
      setSubsState(prev => prev.map(s => 
        namesToCancel.includes(s.name) ? { ...s, status: 'unused' } : s
      ));
      setShowSmartModal(false);
      
      toast.success('Saved ₹418/month — great decision!', {
        icon: '✅',
        style: { borderRadius: '10px', background: '#22c55e', color: '#000', fontWeight: 'bold' }
      });
    } catch (err) {
      toast.error("Failed to cancel subscriptions.");
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 relative h-full">

      {error && (
        <div className="bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444] px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}
      
      {/* Header Section */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Subscriptions</h1>
        <p className="text-base sm:text-xl text-white font-medium mb-4">
          You are spending {formatCurrency(totalMonthlySpend)}/month on subscriptions
        </p>

        {potentialSavings > 0 && (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand/10 border border-brand/30 rounded-full text-brand font-medium">
            <AlertTriangle className="w-4 h-4" />
            You could save {formatCurrency(potentialSavings)} by cancelling {wastedSubs.length} unused apps
          </div>
        )}
      </div>

      {/* Tabs & Search */}
      <div className="bg-[#1f2937] border border-gray-800 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row justify-between gap-3">
        {/* Tabs — scroll horizontally on mobile */}
        <div className="flex gap-1 overflow-x-auto">
          {[
            { id: 'active', label: 'Active', activeClass: 'bg-[#111827] text-[#22c55e]' },
            { id: 'forgotten', label: 'Forgotten', activeClass: 'bg-[#111827] text-[#ef4444]' },
            { id: 'unused', label: 'Unused', activeClass: 'bg-[#111827] text-[#f59e0b]' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors shrink-0 min-h-[44px] relative ${activeTab === tab.id ? tab.activeClass : 'text-gray-500 hover:text-white'}`}
            >
              {tab.label}
              {tab.id === 'forgotten' && hasForgotten && <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#ef4444]"></span>}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input 
            type="text" 
            placeholder="Search subscriptions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-[#111827] border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e] min-h-[44px]"
          />
        </div>
      </div>

      {/* Subscriptions List */}
      <div className="space-y-4 pb-24">
        {displayedSubs.length > 0 ? (
          displayedSubs.map((sub, i) => {
             const isForgotten = sub.status === 'forgotten';
             const isUnused = sub.status === 'unused';
             const daysAgo = Math.floor((new Date() - new Date(sub.last_used)) / (1000 * 60 * 60 * 24));
             const showRedDate = daysAgo > 20;

             return (
              <div key={i} className={`bg-[#1f2937] border rounded-xl overflow-hidden transition-all
                 ${isUnused ? 'border-danger/30' : isForgotten ? 'border-warning/30' : 'border-gray-800'}
              `}>
                <div className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  
                  {/* Avatar & Name */}
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-lg ${getAvatarColor(sub.name)}`}>
                      {sub.name.substring(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg font-bold text-white">{sub.name}</span>
                        {isForgotten && <span className="text-[10px] uppercase tracking-wider font-bold bg-warning/20 text-warning px-2 py-0.5 rounded border border-warning/30">Forgotten</span>}
                        {isUnused && <span className="text-[10px] uppercase tracking-wider font-bold bg-danger/20 text-danger px-2 py-0.5 rounded border border-danger/30">Unused</span>}
                      </div>
                      <div className="text-sm">
                         <span className={showRedDate ? "text-danger" : "text-muted"}>
                            Last used: {!sub.last_used.includes('Z') ? sub.last_used : new Date(sub.last_used).toLocaleDateString()}
                         </span>
                      </div>
                    </div>
                  </div>

                  {/* Price Details */}
                  <div className="text-left flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto border-t sm:border-0 border-gray-800 pt-4 sm:pt-0">
                    <div className="text-xl font-bold text-white">{formatCurrency(sub.amount)}</div>
                    <div className="text-brand text-sm font-medium">{sub.billing_cycle}</div>
                  </div>
                  
                </div>

                {/* Expanded Action for UNUSED */}
                {isUnused && (
                  <div className="bg-[#111827] px-5 py-3 border-t border-gray-800 flex justify-end">
                     <button 
                       onClick={() => {
                         cancelSubscriptions([sub.name]).then(() => {
                           setSubsState(prev => prev.filter(s => s.name !== sub.name));
                           toast.success(`Cancelled ${sub.name}`);
                         })
                       }}
                       className="text-sm font-semibold border border-[#ef4444] text-[#ef4444] px-6 py-3 rounded-xl hover:bg-[#7f1d1d] active:scale-95 transition-all duration-200 min-h-[48px] cursor-pointer">
                       Cancel Subscription
                     </button>
                  </div>
                )}
              </div>
            )
          })
        ) : (
          <div className="bg-[#1f2937] border border-gray-800 rounded-xl p-12 text-center">
            <p className="text-muted mb-2">No {activeTab} subscriptions found.</p>
          </div>
        )}
      </div>

      {/* Smart Recommendation Modal */}
      {showSmartModal && wastedSubs.length >= 2 && (
        <div className="fixed bottom-0 left-0 right-0 bg-base/80 backdrop-blur-md border-t border-gray-800 p-6 z-50 flex justify-center animate-in slide-in-from-bottom-10">
          <div className="max-w-2xl w-full bg-[#1f2937] border border-gray-700 shadow-2xl rounded-2xl p-6 relative">
            <button 
              onClick={() => setShowSmartModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex gap-4">
               <div className="bg-brand/20 p-3 rounded-full h-fit">
                 <PenLine className="w-6 h-6 text-brand" />
               </div>
               <div>
                  <h3 className="font-bold text-lg text-white mb-2">Smart Recommendation</h3>
                  <p className="text-muted text-sm mb-4 leading-relaxed">
                    Cancelling <span className="text-white font-medium">{wastedSubs[0].name}</span> and <span className="text-white font-medium">{wastedSubs[1].name}</span> saves <span className="text-brand font-bold">{formatCurrency(potentialSavings)}/month</span> based on your usage history.
                  </p>
                  <div className="flex gap-3">
                    <button 
                       onClick={handleSmartCancel}
                       className="px-6 py-3 border border-[#ef4444] font-bold rounded-xl hover:bg-[#7f1d1d] text-[#ef4444] active:scale-95 transition-all duration-200 min-h-[48px] cursor-pointer"
                     >
                       Cancel Both
                     </button>
                     <button 
                       onClick={() => setShowSmartModal(false)}
                       className="px-6 py-3 bg-[#374151] font-semibold text-white rounded-xl hover:bg-[#4b5563] active:scale-95 transition-all duration-200 min-h-[48px] cursor-pointer border border-gray-700"
                     >
                       Remind Me Later
                     </button>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
