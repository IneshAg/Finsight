import { useState, useEffect } from 'react';
import { ShieldAlert, Bot, Activity, CreditCard, ChevronRight } from 'lucide-react';
import api from '../services/api';

export default function TestML() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [merchantInput, setMerchantInput] = useState('SWIGGY ORDER 9284');
  const [classifyResult, setClassifyResult] = useState(null);
  const [isClassifying, setIsClassifying] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const { data } = await api.get('/ml/status');
      setStatus(data);
    } catch (error) {
      console.error("Error fetching ML status", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClassify = async () => {
    if (!merchantInput.trim()) return;
    setIsClassifying(true);
    try {
      const { data } = await api.post('/ml/classify', { merchant: merchantInput });
      setClassifyResult(data);
    } catch (error) {
      console.error("Error classifying", error);
    } finally {
      setIsClassifying(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center text-[rgba(255,255,255,0.4)]">
        Loading ML Models...
      </div>
    );
  }

  const models = [
    { id: 'merchant_classifier', name: 'Transaction Classifier', icon: Bot, color: '#22c55e' },
    { id: 'spending_forecaster', name: 'Spending Forecaster', icon: Activity, color: '#3b82f6' },
    { id: 'anomaly_scorer', name: 'Anomaly Scorer', icon: ShieldAlert, color: '#f59e0b' },
    { id: 'card_recommender', name: 'Card Recommender', icon: CreditCard, color: '#ef4444' }
  ];

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Bot className="text-[#3b82f6]" size={28} />
          AI Engine Playground
        </h1>
        <p className="text-[rgba(255,255,255,0.5)] mt-2">
          Verify the status of the FinSight ML layer and interact with the deployed models.
        </p>
      </div>

      {/* Model Status Grid */}
      <h2 className="text-lg font-semibold text-white mb-4">Deployed Models</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {models.map(model => {
          const isLoaded = status?.models?.[model.id] === 'loaded';
          const accuracy = status?.accuracy_metrics?.[model.id] || 'N/A';
          const Icon = model.icon;
          
          return (
            <div key={model.id} className="bg-[#0F1612] border border-[rgba(255,255,255,0.08)] rounded-2xl p-5 flex flex-col justify-between">
              <div className="flex items-start justify-between mb-4">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center bg-[rgba(255,255,255,0.03)]"
                  style={{ color: model.color }}
                >
                  <Icon size={20} />
                </div>
                <div className={`px-2 py-1 text-[10px] font-bold rounded-full ${isLoaded ? 'bg-[rgba(34,197,94,0.15)] text-[#22c55e]' : 'bg-[rgba(239,68,68,0.15)] text-[#ef4444]'}`}>
                  {isLoaded ? 'ONLINE' : 'OFFLINE'}
                </div>
              </div>
              <div>
                <h3 className="text-white font-medium text-sm mb-1">{model.name}</h3>
                <p className="text-[11px] text-[rgba(255,255,255,0.4)]">Tech: {accuracy}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Testing Area */}
      <h2 className="text-lg font-semibold text-white mt-8 mb-4">Test Merchant Classifier</h2>
      <div className="bg-[#0F1612] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
        <p className="text-sm text-[rgba(255,255,255,0.5)] mb-4">
          Enter a raw merchant string from a bank statement (e.g., "SWIGGY ORDER 9284", "ZOMATO*NEW DELHI", "UBER RIDES"). 
          The ML model uses a TF-IDF vectorizer and Logistic Regression to predict the category.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <input 
            type="text" 
            value={merchantInput}
            onChange={(e) => setMerchantInput(e.target.value)}
            className="flex-1 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#3b82f6] transition-colors"
            placeholder="E.g. AMZN PAY INDIA..."
          />
          <button 
            onClick={handleClassify}
            disabled={isClassifying}
            className="bg-[#3b82f6] hover:bg-blue-500 text-white font-medium px-6 py-3 rounded-xl transition-colors disabled:opacity-50 min-w-[120px]"
          >
            {isClassifying ? 'Predicting...' : 'Predict'}
          </button>
        </div>

        {classifyResult && (
          <div className="mt-6 bg-[rgba(59,130,246,0.1)] border border-[rgba(59,130,246,0.2)] rounded-xl p-4 flex items-center justify-between animate-in slide-in-from-bottom-2">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-[#3b82f6] font-bold mb-1">Predicted Category</div>
              <div className="text-white text-lg font-medium">{classifyResult.category}</div>
            </div>
            <ChevronRight className="text-[#3b82f6] opacity-50" />
          </div>
        )}
      </div>
    </div>
  );
}
