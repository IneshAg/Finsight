import React, { useEffect, useState, useCallback } from 'react';
import { Loader2, Zap, Database } from 'lucide-react';
import { useConsent } from '../hooks/useConsent';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function ConnectBank() {
  const { initiateConsent, checkConsentStatus, loading, isReady } = useConsent();
  const navigate = useNavigate();

  const [demoLoading, setDemoLoading] = useState(false);
  const [demoStatus, setDemoStatus] = useState('');

  // If returning from Setu redirect, poll for consent status
  useEffect(() => {
    const stopFn = checkConsentStatus();
    return () => { if (stopFn) stopFn(); };
  }, [checkConsentStatus]);

  useEffect(() => {
    if (isReady) navigate('/dashboard');
  }, [isReady, navigate]);

  const loadDemoData = useCallback(async () => {
    setDemoLoading(true);
    setDemoStatus('Starting ML pipeline…');
    try {
      // 1. Trigger the demo sync
      const res = await api.post('/demo/load/priya_sharma');
      const { user_id } = res.data;

      // 2. Store the demo user_id as consentId so ProtectedRoutes work
      localStorage.setItem('consentId', user_id);
      localStorage.setItem('user', JSON.stringify({ name: 'Priya Sharma', email: 'priya@demo.finsight' }));

      setDemoStatus('Processing 12 months of transactions…');

      // 3. Poll /insights/sync/status until completed
      let attempts = 0;
      const pollInterval = setInterval(async () => {
        attempts++;
        try {
          const statusRes = await api.get('/insights/sync/status');
          const { status } = statusRes.data;
          if (status === 'completed') {
            clearInterval(pollInterval);
            setDemoStatus('Ready!');
            setTimeout(() => navigate('/dashboard'), 400);
          } else if (status === 'failed') {
            clearInterval(pollInterval);
            setDemoStatus('Sync failed — check backend logs');
            setDemoLoading(false);
          } else {
            setDemoStatus(`Running ML pipeline… (${attempts * 2}s)`);
          }
        } catch (_) {
          // Backend might be a bit slow to respond — keep polling
        }
        if (attempts > 30) {
          clearInterval(pollInterval);
          setDemoStatus('Timed out — check backend is running');
          setDemoLoading(false);
        }
      }, 2000);

    } catch (err) {
      console.error('Demo load failed', err);
      setDemoStatus('Error — is the backend running on :8000?');
      setDemoLoading(false);
    }
  }, [navigate]);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0B0F0E',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 16px',
      fontFamily: "'Inter', sans-serif",
    }}>

      {/* Brand */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 32 }}>⚡</span>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: 32 }}>FinSight</span>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, letterSpacing: '0.05em' }}>
          Your Financial Early-Warning System
        </p>
      </div>

      {/* Card */}
      <div style={{
        width: '100%',
        maxWidth: 460,
        background: '#111916',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 24,
        padding: 32,
      }}>
        <h2 style={{ color: '#fff', fontWeight: 700, fontSize: 22, marginBottom: 8 }}>
          Connect your bank to get started
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 32, lineHeight: 1.6 }}>
          We use Setu Account Aggregator — your data is encrypted and never stored without your explicit consent.
        </p>

        {/* Setu button */}
        <button
          onClick={initiateConsent}
          disabled={loading || demoLoading}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 8, padding: '14px 20px', borderRadius: 14, border: 'none',
            background: '#00E676', color: '#000', fontWeight: 700, fontSize: 15,
            cursor: loading || demoLoading ? 'not-allowed' : 'pointer',
            opacity: loading || demoLoading ? 0.6 : 1,
            transition: 'all 150ms',
          }}
        >
          {loading ? <><Loader2 className="animate-spin" size={18} /> Connecting…</> : 'Connect via Setu AA'}
        </button>

        {/* Divider */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          margin: '24px 0', color: 'rgba(255,255,255,0.2)', fontSize: 12,
        }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
          OR
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
        </div>

        {/* Demo section */}
        <div style={{
          background: 'rgba(0,230,118,0.04)',
          border: '1px solid rgba(0,230,118,0.15)',
          borderRadius: 16,
          padding: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Database size={16} color="#00E676" />
            <span style={{ color: '#00E676', fontWeight: 600, fontSize: 14 }}>Try with Demo Data</span>
            <span style={{
              background: 'rgba(0,230,118,0.15)', color: '#00E676',
              fontSize: 10, fontWeight: 700, borderRadius: 999,
              padding: '2px 8px', letterSpacing: '0.05em',
            }}>HACKATHON DEMO</span>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>
            Load <strong style={{ color: '#fff' }}>Priya Sharma</strong> — 12 months of real transaction data through the full ML pipeline.
            No bank required.
          </p>

          <button
            id="load-demo-btn"
            onClick={loadDemoData}
            disabled={demoLoading || loading}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 8, padding: '12px 20px', borderRadius: 12,
              border: '1px solid rgba(0,230,118,0.3)',
              background: demoLoading ? 'rgba(0,230,118,0.05)' : 'rgba(0,230,118,0.08)',
              color: '#00E676', fontWeight: 700, fontSize: 14,
              cursor: demoLoading || loading ? 'not-allowed' : 'pointer',
              opacity: demoLoading || loading ? 0.8 : 1,
              transition: 'all 150ms',
            }}
          >
            {demoLoading ? (
              <><Loader2 className="animate-spin" size={16} /> {demoStatus || 'Loading…'}</>
            ) : (
              <><Zap size={16} /> Load Demo Data</>
            )}
          </button>

          {demoStatus && !demoLoading && (
            <p style={{ color: '#ef4444', fontSize: 12, marginTop: 8, textAlign: 'center' }}>
              {demoStatus}
            </p>
          )}
        </div>

        <div style={{ marginTop: 20, textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>
          Supported banks: HDFC, ICICI, SBI, Axis and 50+ more
        </div>
      </div>
    </div>
  );
}
