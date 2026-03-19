import { useState, useCallback, useRef } from 'react';
import { createConsent, getConsentStatus } from '../services/api';
import toast from 'react-hot-toast';

export function useConsent() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const pollIntervalRef = useRef(null);

  const initiateConsent = async () => {
    try {
      setLoading(true);
      const res = await createConsent();
      const { consentId, consentUrl } = res.data;
      
      if (consentId) {
        localStorage.setItem('consentId', consentId);
      }
      
      if (consentUrl) {
        // Redirect user to Setu's consent approval page
        window.location.href = consentUrl;
      } else {
        toast.error("Setu did not return a valid consent URL.");
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to initiate Setu consent.");
      setLoading(false);
    }
  };

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  const checkConsentStatus = useCallback(() => {
    const consentId = localStorage.getItem('consentId');
    if (!consentId) return;

    // Clear any existing poll to avoid duplicate overlapping intervals
    stopPolling();

    // Start polling every 3 seconds
    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await getConsentStatus(consentId);
        const currentStatus = res.data.status;
        
        setStatus(currentStatus);

        if (currentStatus === "ACTIVE") {
          setIsReady(true);
          stopPolling();
        } else if (currentStatus === "REJECTED" || currentStatus === "REVOKED") {
          toast.error(`Consent was ${currentStatus.toLowerCase()}`);
          stopPolling();
        }
      } catch (error) {
        console.error("Error polling consent status:", error);
      }
    }, 3000);

    return stopPolling;
  }, [stopPolling]);

  return {
    initiateConsent,
    checkConsentStatus,
    stopPolling,
    loading,
    status,
    isReady
  };
}
