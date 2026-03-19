import os
import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from ml.data.generate import generate_synthetic_data

def train_and_save_models():
    print("Starting ML Model Training Pipeline...")
    
    # 1. Generate Data
    print("Generating synthetic training data...")
    os.makedirs("ml/data", exist_ok=True)
    os.makedirs("ml/models", exist_ok=True)
    
    # Run generator if files don't exist
    if not os.path.exists("ml/data/merchant_labels.csv"):
        from ml.data.generate import generate_synthetic_data
        txs, labels = generate_synthetic_data()
        pd.DataFrame(labels).to_csv("ml/data/merchant_labels.csv", index=False)
        import json
        with open("ml/data/sample_transactions.json", "w") as f:
            json.dump(txs, f, indent=2)

    # 2. Train Model 1: Merchant Classifier
    print("Training Model 1: Merchant Classifier...")
    df_labels = pd.read_csv("ml/data/merchant_labels.csv")
    
    vectorizer = TfidfVectorizer(ngram_range=(1, 2))
    X = vectorizer.fit_transform(df_labels['merchant'])
    y = df_labels['category']
    
    model1 = LogisticRegression(max_iter=1000)
    model1.fit(X, y)
    
    joblib.dump(model1, "ml/models/transaction_classifier.pkl")
    joblib.dump(vectorizer, "ml/models/vectorizer.pkl")
    print(f"Model 1 trained on {len(df_labels)} merchants.")

    # 3. Model 2: Spending Forecaster (Placeholder/Base model)
    from ml.spending_forecaster import SpendingForecaster
    model2 = SpendingForecaster()
    joblib.dump(model2, "ml/models/spending_forecaster.pkl")
    print("Model 2 saved.")

    # 4. Model 3: Anomaly Scorer (Placeholder/Base model)
    from ml.anomaly_scorer import AnomalyScorer
    model3 = AnomalyScorer()
    joblib.dump(model3, "ml/models/anomaly_scorer.pkl")
    print("Model 3 saved.")

    # 5. Model 4: Card Recommender (Matrix-based)
    from ml.card_recommender import CardRecommender
    model4 = CardRecommender()
    joblib.dump(model4, "ml/models/card_recommender.pkl")
    print("Model 4 saved.")
    
    print("All 4 models trained and saved to ml/models/.")

if __name__ == "__main__":
    train_and_save_models()
