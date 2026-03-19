import numpy as np
import os
import joblib
from sklearn.linear_model import LinearRegression

class SpendingForecaster:
    def __init__(self, model_dir="ml/models/forecast/"):
        self.model_dir = model_dir
        os.makedirs(self.model_dir, exist_ok=True)

    def forecast_monthly_risk(self, user_history: list) -> dict:
        """
        user_history: list of floats [W1, W2, W3, W4] for the last 3 months
        Example: [1000, 2000, 3000, 4000, 1100, 2100, 3100, 4100, 1200, 2200, 3200, 4200]
        """
        if len(user_history) < 12:
            return self._rule_based_fallback(user_history)

        try:
            # Predict next 4 weeks
            X = np.arange(len(user_history)).reshape(-1, 1)
            y = np.array(user_history)
            
            model = LinearRegression()
            model.fit(X, y)
            
            next_X = np.arange(len(user_history), len(user_history) + 4).reshape(-1, 1)
            predictions = model.predict(next_X)
            
            # Ensure no negative predictions
            predictions = [max(0.0, float(p)) for p in predictions]
            
            # Risk Level
            max_p = max(predictions)
            if max_p > 4000:
                risk = "HIGH"
            elif max_p > 2000:
                risk = "MODERATE"
            else:
                risk = "LOW"
            
            return {
                "week_predictions": {
                    "W1": predictions[0],
                    "W2": predictions[1],
                    "W3": predictions[2],
                    "W4": predictions[3]
                },
                "risk_level": risk
            }
        except Exception:
            return self._rule_based_fallback(user_history)

    def _rule_based_fallback(self, user_history: list) -> dict:
        # Simple average of last few weeks if history is missing or fails
        if not user_history:
            return {"week_predictions": {"W1": 0.0, "W2": 0.0, "W3": 0.0, "W4": 0.0}, "risk_level": "LOW"}
        
        avg = sum(user_history) / len(user_history)
        predictions = [avg] * 4
        
        if avg > 4000:
            risk = "HIGH"
        elif avg > 2000:
            risk = "MODERATE"
        else:
            risk = "LOW"
            
        return {
            "week_predictions": {"W1": avg, "W2": avg, "W3": avg, "W4": avg},
            "risk_level": risk
        }
