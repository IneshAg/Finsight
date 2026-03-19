import joblib
import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

class MerchantClassifier:
    def __init__(self, model_path="ml/models/merchant_classifier.pkl", vectorizer_path="ml/models/vectorizer.pkl"):
        self.model_path = model_path
        self.vectorizer_path = vectorizer_path
        self.model = None
        self.vectorizer = None
        self.fallback_map = {
            "swiggy": "Food and Dining",
            "zomato": "Food and Dining",
            "amazon": "Shopping",
            "flipkart": "Shopping",
            "uber": "Travel",
            "ola": "Travel",
            "netflix": "Entertainment",
            "hotstar": "Entertainment",
            "airtel": "Utilities",
            "jio": "Utilities",
            "rent": "Rent",
            "emi": "EMI",
            "loan": "EMI"
        }
        self.load()

    def load(self):
        if os.path.exists(self.model_path) and os.path.exists(self.vectorizer_path):
            try:
                self.model = joblib.load(self.model_path)
                self.vectorizer = joblib.load(self.vectorizer_path)
            except Exception:
                self.model = None
                self.vectorizer = None

    def classify_merchant(self, merchant_name: str) -> str:
        if self.model and self.vectorizer:
            try:
                X = self.vectorizer.transform([merchant_name])
                return self.model.predict(X)[0]
            except Exception:
                pass
        
        # Fallback to keyword matching
        name_lower = merchant_name.lower()
        for key, cat in self.fallback_map.items():
            if key in name_lower:
                return cat
        
        return "Other"
