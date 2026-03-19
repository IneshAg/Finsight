import numpy as np
import os
from sklearn.ensemble import IsolationForest

class AnomalyScorer:
    def __init__(self):
        pass

    def score_anomaly(self, amounts: list) -> dict:
        if len(amounts) < 10:
            return self._rule_based_fallback(amounts)

        try:
            X = np.array(amounts).reshape(-1, 1)
            # Higher contamination means we expect more outliers
            clf = IsolationForest(contamination=0.1, random_state=42)
            preds = clf.fit_predict(X)
            scores = clf.decision_function(X) # Higher score = less abnormal
            
            # Get score for the latest transaction
            latest_score = float(scores[-1])
            is_anomaly = bool(preds[-1] == -1)
            
            # Normalize score to 0-1 (0 is normal, 1 is highly anomalous)
            # IsolationForest decision_function returns values roughly in [-0.5, 0.5]
            norm_score = max(0.0, min(1.0, (0.5 - latest_score)))
            
            return {
                "score": norm_score,
                "is_anomaly": is_anomaly
            }
        except Exception:
            return self._rule_based_fallback(amounts)

    def _rule_based_fallback(self, amounts: list) -> dict:
        if len(amounts) < 2:
            return {"score": 0.0, "is_anomaly": False}
        
        latest = amounts[-1]
        historical = amounts[:-1]
        avg = sum(historical) / len(historical)
        
        if latest > 2 * avg and avg > 0:
            return {"score": 0.8, "is_anomaly": True}
        
        return {"score": 0.1, "is_anomaly": False}
