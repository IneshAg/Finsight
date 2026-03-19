import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { User, Building2, Bell, Shield, Palette, HelpCircle, Camera, ChevronRight } from 'lucide-react';
import { useConsent } from '../hooks/useConsent';
import { updateProfile } from '../services/api';

// --- Reusable Toggle ---
function Toggle({ checked, onChange }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none
        ${checked ? 'bg-brand' : 'bg-gray-700'}`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200 ease-in-out
          ${checked ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  );
}

// --- Sub-nav config ---
const NAV_ITEMS = [
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'banks', label: 'Connected Banks', icon: Building2 },
  { id: 'privacy', label: 'Privacy', icon: Shield },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'help', label: 'Help', icon: HelpCircle },
];

// --- Sections ---

function NotificationsSection() {
  const [prefs, setPrefs] = useState({
    billAlerts: true,
    cardWins: true,
    weeklyReport: true,
    streakReminders: false,
    budgetExceeded: true,
    monthlyForecast: true,
  });
  const [earlyAlert, setEarlyAlert] = useState('5');
  const [alertTime, setAlertTime] = useState('09:30');

  const toggleItem = (key) => setPrefs(p => ({ ...p, [key]: !p[key] }));

  const rows = [
    { key: 'billAlerts', label: 'Bill Alerts', desc: 'Get reminded before your bills are due.' },
    { key: 'cardWins', label: 'Card Wins', desc: 'Notification when you earn rewards points.' },
    { key: 'weeklyReport', label: 'Weekly Report', desc: 'Summary of your weekly spending habits.' },
    { key: 'streakReminders', label: 'Streak Reminders', desc: "Don't lose your savings streak." },
    { key: 'budgetExceeded', label: 'Budget Exceeded', desc: 'Critical alerts when you go over limit.', danger: true },
    { key: 'monthlyForecast', label: 'Monthly Forecast', desc: "Predictions for the coming month's finances." },
  ];

  const inputClass = "bg-surface border border-gray-700 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand";

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-2">Notification Preferences</h2>
      <p className="text-muted text-sm mb-8">Choose what you'd like to be notified about.</p>

      <div className="space-y-1 mb-8">
        {rows.map((row) => (
          <div key={row.key} className="flex items-center justify-between p-4 rounded-xl hover:bg-surface transition-colors group">
            <div>
              <div className={`font-medium ${row.danger ? 'text-danger' : 'text-white'}`}>{row.label}</div>
              <div className="text-sm text-muted mt-0.5">{row.desc}</div>
            </div>
            <Toggle checked={prefs[row.key]} onChange={() => toggleItem(row.key)} />
          </div>
        ))}
      </div>

      {/* Alert timing preferences */}
      <div className="border-t border-gray-800 pt-8">
        <h3 className="text-white font-semibold mb-4">Alert Timing</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-muted mb-2">How early to alert</label>
            <select value={earlyAlert} onChange={e => setEarlyAlert(e.target.value)} className={`w-full ${inputClass}`}>
              {['1', '2', '3', '5', '7'].map(d => (
                <option key={d} value={d}>{d} day{d !== '1' ? 's' : ''} before</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-muted mb-2">Preferred alert time</label>
            <input type="time" value={alertTime} onChange={e => setAlertTime(e.target.value)} className={`w-full ${inputClass}`} />
          </div>
        </div>
      </div>

      <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-end">
        <button
          onClick={() => toast.success('Notification preferences saved!')}
          className="w-full sm:w-auto px-6 py-3 bg-[#22c55e] text-black font-semibold rounded-xl hover:bg-[#16a34a] active:scale-95 transition-all duration-200 min-h-[48px] cursor-pointer"
        >
          Save Preferences
        </button>
      </div>
    </div>
  );
}

function ProfileSection() {
  const [name, setName] = useState('Priya Sharma');
  const [email, setEmail] = useState('priya@email.com');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [avatar, setAvatar] = useState(null);
  const fileRef = useRef();

  const handleSave = async () => {
    try {
      await updateProfile({ name, email, phone });
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to update profile.');
    }
  };

  const inputClass = "w-full bg-surface border border-gray-700 text-white text-sm rounded-lg px-4 py-3 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand placeholder-gray-600";

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-2">Profile</h2>
      <p className="text-muted text-sm mb-8">Manage your personal information.</p>

      {/* Avatar */}
      <div className="flex flex-col items-center mb-10">
        <div
          onClick={() => fileRef.current.click()}
          className="relative w-28 h-28 rounded-full bg-brand/20 border-2 border-brand/40 flex items-center justify-center cursor-pointer hover:border-brand transition-colors group overflow-hidden"
        >
          {avatar ? (
            <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-4xl font-bold text-brand">PS</span>
          )}
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="w-6 h-6 text-white mb-1" />
            <span className="text-white text-xs font-medium">Change</span>
          </div>
        </div>
        <p className="text-muted text-xs mt-3">400×400px recommended</p>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files[0]) setAvatar(URL.createObjectURL(e.target.files[0]));
          }}
        />
      </div>

      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm text-muted mb-2">Full Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Full Name" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm text-muted mb-2">Email Address</label>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Email" className={inputClass} />
          </div>
        </div>
        <div>
          <label className="block text-sm text-muted mb-2">Phone Number</label>
          <input value={phone} onChange={e => setPhone(e.target.value)} type="tel" placeholder="Phone Number" className={inputClass} />
        </div>
      </div>

      <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-end">
        <button onClick={handleSave} className="w-full sm:w-auto px-6 py-3 bg-[#22c55e] text-black font-semibold rounded-xl hover:bg-[#16a34a] active:scale-95 transition-all duration-200 min-h-[48px] cursor-pointer">
          Save Profile
        </button>
      </div>
    </div>
  );
}

function BanksSection() {
  const { initiateConsent, loading } = useConsent();

  const banks = [
    { name: 'HDFC Bank', logo: 'H', connected: true, color: 'bg-blue-600' },
    { name: 'ICICI Bank', logo: 'I', connected: true, color: 'bg-orange-600' },
    { name: 'State Bank of India', logo: 'S', connected: false, color: 'bg-indigo-700' },
  ];

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-2">Connected Banks</h2>
      <p className="text-muted text-sm mb-8">Manage your bank account connections via Setu AA.</p>

      <div className="space-y-4">
        {banks.map((bank) => (
          <div key={bank.name} className="flex items-center justify-between p-5 bg-surface border border-gray-800 rounded-xl hover:border-gray-700 transition-colors">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl ${bank.color} flex items-center justify-center font-bold text-white text-xl`}>
                {bank.logo}
              </div>
              <div>
                <div className="font-semibold text-white">{bank.name}</div>
                <div className={`flex items-center gap-1.5 text-sm mt-0.5 ${bank.connected ? 'text-brand' : 'text-gray-500'}`}>
                  <span className={`w-2 h-2 rounded-full ${bank.connected ? 'bg-brand' : 'bg-gray-600'}`}></span>
                  {bank.connected ? 'Connected' : 'Not connected'}
                </div>
              </div>
            </div>

            {bank.connected ? (
              <button className="px-4 py-2 text-sm font-medium border border-gray-700 text-gray-300 rounded-lg hover:border-gray-500 hover:text-white transition-colors min-h-[44px] cursor-pointer">
                Manage
              </button>
            ) : (
              <button
                onClick={initiateConsent}
                disabled={loading}
                className="px-4 py-2 text-sm font-semibold border border-[#22c55e] text-[#22c55e] rounded-lg hover:bg-[#22c55e] hover:text-black active:scale-95 transition-all duration-200 disabled:opacity-50 min-h-[44px] cursor-pointer"
              >
                {loading ? 'Connecting...' : 'Connect'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function PlaceholderSection({ title }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <div className="text-4xl mb-4">🔧</div>
      <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
      <p className="text-muted">This section is coming soon.</p>
    </div>
  );
}

// --- Main Settings Component ---
export default function Settings() {
  const [activeSection, setActiveSection] = useState('notifications');

  const renderSection = () => {
    switch (activeSection) {
      case 'notifications': return <NotificationsSection />;
      case 'profile': return <ProfileSection />;
      case 'banks': return <BanksSection />;
      case 'privacy': return <PlaceholderSection title="Privacy & Security" />;
      case 'appearance': return <PlaceholderSection title="Appearance" />;
      case 'help': return <PlaceholderSection title="Help & Support" />;
      default: return null;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Settings</h1>
        <p className="text-gray-500 text-sm sm:text-base">Manage your account, preferences, and connected services.</p>
      </div>

      {/* Mobile: horizontal scrollable tabs. Desktop: vertical left panel */}
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
        {/* Mobile: horizontal tab bar. Desktop: vertical nav */}
        <div className="lg:hidden flex gap-1 overflow-x-auto pb-1 border-b border-gray-800 mb-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium transition-all shrink-0 min-h-[44px] ${
                  isActive
                    ? 'bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20'
                    : 'text-gray-500 hover:text-white hover:bg-[#111827]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#22c55e]' : ''}`} />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Desktop: vertical sidebar */}
        <aside className="hidden lg:block w-52 shrink-0">
          <nav className="space-y-1 sticky top-4">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all min-h-[44px] ${
                    isActive
                      ? 'bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20'
                      : 'text-gray-500 hover:text-white hover:bg-[#111827]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#22c55e]' : ''}`} />
                  {item.label}
                  {isActive && <ChevronRight className="w-3 h-3 ml-auto text-[#22c55e]/50" />}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0 bg-[#1f2937] border border-gray-800 rounded-2xl p-5 sm:p-8">
          {renderSection()}
        </main>
      </div>
    </div>
  );
}
