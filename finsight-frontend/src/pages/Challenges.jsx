import { Trophy, Zap, TrendingUp, Shield, Medal, FastForward, Activity, Target, Crown, Flame, Utensils, RefreshCw, Car } from 'lucide-react';
import StatCard from '../components/StatCard';

export default function Challenges() {
  
  // Dummy gamification data
  const stats = {
    xp: "1,250",
    rank: "Top 18%",
    badgesEarned: 3,
    totalBadges: 9
  };

  const earnedBadges = [
    { name: "Shield", icon: Shield, date: "Jan 12", color: "text-brand" },
    { name: "Titan", icon: Medal, date: "Feb 05", color: "text-blue-500" },
    { name: "Fast Start", icon: FastForward, date: "Feb 18", color: "text-purple-500" }
  ];

  const lockedBadges = [
    { name: "Centurion", icon: Shield, goal: "100 day streak", status: "Day 12 of 100", progress: 12 },
    { name: "Debt Free", icon: Target, goal: "Pay off 1 EMI", status: "3 days remaining", progress: 90 },
    { name: "Investor", icon: TrendingUp, goal: "Invest first ₹500", status: "Save ₹200 more", progress: 60 },
    { name: "Sniper", icon: Target, goal: "10 Card Wins", status: "2 transactions away", progress: 80 },
    { name: "King", icon: Crown, goal: "Health Score 90", status: "Current Score: 68", progress: 68 },
    { name: "Hoarder", icon: Activity, goal: "Save ₹10,000", status: "₹4,500 saved", progress: 45 }
  ];

  const exploreChallenges = [
    {
       title: "7 Day No Dining Out",
       icon: Utensils,
       xp: 250,
       tags: ["7 DAYS", "FOOD"],
       desc: "Master the art of home cooking."
    },
    {
      title: "Subscription Audit",
      icon: RefreshCw,
      xp: 500,
      tags: ["ONETIME", "BILLS"],
      desc: "Review all recurring payments and cancel at least two services you don't use."
    },
    {
      title: "Commute Smart",
      icon: Car,
      xp: 300,
      tags: ["4 DAYS", "TRAVEL"],
      desc: "Use public transport or carpool for 4 days instead of driving alone."
    }
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-10 pb-20">
      
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 flex items-center gap-3">
          <Trophy className="w-7 h-7 sm:w-8 sm:h-8 text-[#22c55e]" /> Challenges &amp; Rewards
        </h1>
        <p className="text-gray-500 text-sm sm:text-base">Turn your financial goals into achievable daily habits.</p>
      </div>

      {/* Hero Streak Banner — stacks on mobile, side-by-side on md+ */}
      <div className="bg-[#14532d]/40 border border-[#22c55e]/20 rounded-2xl relative overflow-hidden flex flex-col justify-between min-h-[140px] sm:min-h-[160px]">
        <div className="p-5 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center relative z-10 gap-4 sm:gap-6">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="text-5xl sm:text-7xl font-black text-white drop-shadow-md">
              12
            </div>
            <div>
              <div className="text-gray-300 font-bold uppercase tracking-widest text-base sm:text-lg">Day Streak</div>
              <div className="text-[#22c55e] font-medium">Keep it up!</div>
            </div>
          </div>

          <div className="text-left md:text-right">
             <div className="flex items-center gap-2 justify-start md:justify-end mb-1 text-orange-500 font-bold text-base sm:text-xl uppercase tracking-wide">
               <Flame className="w-5 h-5 sm:w-6 sm:h-6 fill-current text-orange-500" /> NO UNNECESSARY SPEND
             </div>
             <div className="text-gray-400 font-medium font-mono text-sm">3 days until next badge</div>
          </div>
        </div>

        {/* Progress bar anchored to bottom */}
        <div className="w-full h-2 bg-black/40 relative z-10 mt-auto">
          <div className="h-full bg-gradient-to-r from-[#22c55e] to-emerald-400 w-[80%] rounded-r-md"></div>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <StatCard title="Total XP" value={stats.xp} icon={Zap} />
        <StatCard title="Rank" value={stats.rank} icon={TrendingUp} />
        <StatCard title="Badges" value={`${stats.badgesEarned} of ${stats.totalBadges}`} icon={Trophy} />
      </div>

      {/* Active Challenge Card (Full Width) */}
      <div className="bg-[#1f2937] border border-gray-800 rounded-2xl overflow-hidden shadow-lg border-l-4 border-l-brand relative">
         <div className="p-8 flex flex-col md:flex-row justify-between gap-6 relative z-10">
            <div className="flex-1">
              <div className="uppercase tracking-widest text-[10px] font-bold text-brand mb-2">Active Challenge</div>
              <h2 className="text-2xl font-bold text-white mb-2">No Unnecessary Spending This Week</h2>
              <p className="text-gray-400 leading-relaxed font-medium mb-4">
                Strictly essentials only. Groceries and bills are okay.
              </p>
              
              <div className="flex items-center gap-4 mb-2">
                 <div className="text-brand font-bold">₹4,200 saved</div>
                 <div className="text-gray-400 text-sm">Day 4 of 7</div>
              </div>

              <div className="w-full max-w-sm h-2.5 bg-surface rounded-full overflow-hidden border border-black/50 mb-3 text-center">
                 <div className="h-full bg-brand rounded-full transition-all" style={{ width: '57%' }}></div>
              </div>
              <p className="text-sm text-gray-500 italic">"Keep going — you are 57% there"</p>
            </div>

             <div className="flex flex-col justify-center border-t md:border-t-0 md:border-l border-gray-800 pt-4 md:pt-0 md:pl-8">
                <button className="w-full md:w-auto px-6 py-3 sm:px-8 sm:py-4 bg-[#22c55e] hover:bg-[#16a34a] text-black font-semibold rounded-xl active:scale-95 transition-all duration-200 shadow min-h-[48px] cursor-pointer flex items-center justify-center gap-2">
                  Post Update <TrendingUp className="w-5 h-5" />
                </button>
             </div>
         </div>
         {/* Subtle pattern or gradient in background optional */}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Column: Badges */}
        <div className="lg:col-span-8 space-y-10">
          
          {/* Earned Badges */}
          <div>
            <h2 className="text-xl font-bold text-white mb-6">Your Badges</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {earnedBadges.map((badge, idx) => {
                const Icon = badge.icon;
                return (
                  <div key={idx} className="bg-[#1f2937] border border-gray-700 rounded-xl p-6 flex flex-col items-center justify-center text-center relative hover:border-gray-500 transition-colors cursor-default group">
                    <div className="absolute top-3 right-3 bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                      Earned
                    </div>
                    <div className="bg-surface p-4 rounded-full mb-4 shadow-inner border border-gray-800 group-hover:scale-110 transition-transform">
                       <Icon className={`w-8 h-8 ${badge.color}`} />
                    </div>
                    <div className="font-bold text-white mb-1">{badge.name}</div>
                    <div className="text-xs text-muted">Earned {badge.date}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Up Next - Locked */}
          <div>
            <h2 className="text-xl font-bold text-white mb-6">Up Next</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
               {lockedBadges.map((badge, idx) => {
                 const Icon = badge.icon;
                 return (
                   <div key={idx} className="bg-surface border border-gray-800 rounded-xl p-5 hover:bg-[#1f2937] transition-colors flex flex-col">
                      <div className="flex items-center gap-3 mb-4">
                         <div className="bg-gray-800 p-2.5 rounded-lg border border-gray-700 text-gray-500">
                           <Icon className="w-5 h-5" />
                         </div>
                         <div>
                           <div className="font-bold text-white text-sm">{badge.name}</div>
                           <div className="text-xs text-muted">{badge.goal}</div>
                         </div>
                      </div>
                      
                      <div className="mt-auto">
                        <div className="w-full h-1.5 bg-gray-800 rounded-full mb-2 overflow-hidden border border-black/20">
                          <div className="h-full bg-blue-500 bg-opacity-70 rounded-full transition-all" style={{ width: `${badge.progress}%` }}></div>
                        </div>
                        <div className="text-[11px] font-mono text-gray-500 text-right">{badge.status}</div>
                      </div>
                   </div>
                 )
               })}
            </div>
          </div>

        </div>

        {/* Right Column: Explore */}
        <div className="lg:col-span-4 space-y-6">
           <h2 className="text-xl font-bold text-white mb-2">Explore Challenges</h2>
           <p className="text-sm text-muted mb-6">Take on new missions to boost your score.</p>
           
           <div className="space-y-4">
             {exploreChallenges.map((challenge, idx) => {
               const Icon = challenge.icon;
               return (
                 <div key={idx} className="bg-[#1f2937] border border-gray-800 rounded-xl p-5 hover:border-gray-600 transition-colors flex flex-col">
                   
                   <div className="flex justify-between items-start mb-3">
                     <div className="bg-surface p-2 rounded-lg text-gray-400 border border-gray-800">
                       <Icon className="w-5 h-5" />
                     </div>
                     <div className="flex gap-2">
                       {challenge.tags.map((tag, t) => (
                         <span key={t} className="text-[9px] font-bold px-1.5 py-0.5 rounded border border-gray-700 text-gray-400 uppercase">{tag}</span>
                       ))}
                     </div>
                   </div>

                   <h3 className="font-bold text-white text-lg mb-2">{challenge.title}</h3>
                   <p className="text-sm text-gray-400 mb-6 flex-1">{challenge.desc}</p>
                   
                   <div className="flex items-center justify-between border-t border-gray-800 pt-4">
                     <div className="text-brand font-bold text-sm flex items-center gap-1">
                       <Zap className="w-4 h-4" /> {challenge.xp} XP
                     </div>
                      <button className="text-[#22c55e] text-sm font-semibold border border-[#22c55e] px-4 py-2.5 rounded-xl hover:bg-[#22c55e] hover:text-black active:scale-95 transition-all duration-200 min-h-[44px] cursor-pointer">
                        Start Challenge
                      </button>
                   </div>
                 </div>
               )
             })}
           </div>
        </div>

      </div>

    </div>
  );
}
