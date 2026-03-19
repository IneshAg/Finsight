import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { UserContext } from './context/UserContext';

// Layout
import Sidebar from './components/Sidebar';

// Pages
import Register from './pages/Register';
import Login from './pages/Login';
import ConnectBank from './pages/ConnectBank';
import Dashboard from './pages/Dashboard';
import RiskForecast from './pages/RiskForecast';
import Subscriptions from './pages/Subscriptions';
import CardWins from './pages/CardWins';
import Challenges from './pages/Challenges';
import Settings from './pages/Settings';
import TestML from './pages/TestML';

// ——————————————————————————————————————
// MainLayout: Sidebar + scrollable main area (responsive)
// ——————————————————————————————————————
function MainLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0d1117' }}>
      {/* Sidebar — hidden on mobile, visible on lg+ */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-[180px]">
        {/* Mobile top bar with hamburger */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-[#111827] border-b border-gray-800 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-white p-2 rounded-lg hover:bg-white/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Open menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2 text-white font-bold text-lg">
            <span className="text-[#22c55e]">⚡</span> FinSight
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

// ——————————————————————————————————————
// ProtectedRoute: requires consentId in localStorage
// ——————————————————————————————————————
function ProtectedRoute({ children }) {
  const consentId = localStorage.getItem('consentId');
  if (!consentId) {
    return <Navigate to="/connect" replace />;
  }
  return children;
}

// ——————————————————————————————————————
// Root redirect: depends on consentId
// ——————————————————————————————————————
function RootRedirect() {
  const consentId = localStorage.getItem('consentId');
  return <Navigate to={consentId ? '/dashboard' : '/connect'} replace />;
}

// ——————————————————————————————————————
// App
// ——————————————————————————————————————
function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try { setUser(JSON.parse(userStr)); } catch { /* ignore */ }
    }
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#1f2937', color: '#fff', border: '1px solid #374151' },
            success: { iconTheme: { primary: '#22c55e', secondary: '#000' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
        <Routes>
          {/* Root smart redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* Public auth routes — no sidebar */}
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />

          {/* Connection page — no sidebar */}
          <Route path="/connect" element={<ConnectBank />} />

          {/* Protected sidebar routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute><MainLayout><Dashboard /></MainLayout></ProtectedRoute>
          } />
          <Route path="/risk" element={
            <ProtectedRoute><MainLayout><RiskForecast /></MainLayout></ProtectedRoute>
          } />
          <Route path="/subscriptions" element={
            <ProtectedRoute><MainLayout><Subscriptions /></MainLayout></ProtectedRoute>
          } />
          <Route path="/card-wins" element={
            <ProtectedRoute><MainLayout><CardWins /></MainLayout></ProtectedRoute>
          } />
          <Route path="/challenges" element={
            <ProtectedRoute><MainLayout><Challenges /></MainLayout></ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute><MainLayout><Settings /></MainLayout></ProtectedRoute>
          } />
          <Route path="/test-ml" element={
            <ProtectedRoute><MainLayout><TestML /></MainLayout></ProtectedRoute>
          } />

          {/* Catch-all */}
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </BrowserRouter>
    </UserContext.Provider>
  );
}

export default App;
