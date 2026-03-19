import { useState, useEffect } from 'react';
import { fetchDashboard } from '../services/api';

export function useSetuData() {
  const [state, setState] = useState({
    loading: true,
    error: null,
    needsConsent: false,
    currentBalance: 0,
    totalSpent: 0,
    budgetHealth: 100,
    subscriptions: [],
    upcomingBills: [],
    weeklyBreakdown: {},
    riskWeeks: [],
    monthlyTrend: {},
    cardWins: null,
    anomalies: []
  });

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      // Check if consent has been granted (we store it locally or it's attached to user DB object)
      const cachedConsent = localStorage.getItem('consentId');
      const userStr = localStorage.getItem('user');
      const userConsent = userStr ? JSON.parse(userStr).consent_id : null;
      
      const hasConsent = !!cachedConsent || !!userConsent;

      if (!hasConsent) {
        if (mounted) {
          setState((prev) => ({ ...prev, loading: false, needsConsent: true }));
        }
        return;
      }

      try {
        const res = await fetchDashboard();
        const data = res.data;

        if (mounted) {
          setState({
            loading: false,
            error: null,
            needsConsent: false,
            currentBalance: data.profile?.current_balance || 0,
            totalSpent: data.risk?.current_quarter_spend || 0,
            budgetHealth: data.budget_health || 100,
            subscriptions: data.subscriptions || [],
            upcomingBills: data.upcoming_bills || [],
            weeklyBreakdown: data.weekly_breakdown || {},
            riskWeeks: data.risk_weeks || [],
            monthlyTrend: data.monthly_spend_trend || {},
            cardWins: data.card_wins || null,
            anomalies: data.anomalies || []
          });
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
        if (mounted) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: err.response?.data?.detail || err.message || "Failed to load financial data."
          }));
        }
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  return state;
}
