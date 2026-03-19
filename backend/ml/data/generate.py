import json
import random
import pandas as pd
from datetime import datetime, timedelta

# Merchant mappings for Model 1 (Classification)
MERCHANT_CATEGORIES = {
    "Food and Dining": [
        "SWIGGY ORDER", "ZOMATO FOOD", "STARBUCKS COFFEE", "DOMINOS PIZZA", 
        "MC DONALDS", "KFC RESTAURANT", "PIZZA HUT", "UBER EATS", "BLUES TOKAI"
    ],
    "Shopping": [
        "AMZN MKTP IN", "FLIPKART PAY", "MYNTRA COM", "AJIO FASHION", 
        "NYKAA RETAIL", "RELIANCE DIGITAL", "DECATHLON SPORT", "LENSKART"
    ],
    "Travel": [
        "UBER INDIA", "OLA CAB", "MAKEMYTRIP", "IRCTC", "INDIGO AIR", 
        "CLEARTRIP", "REDBUS"
    ],
    "Entertainment": [
        "NETFLIX COM", "HOTSTAR DISNEY", "PVR CINEMAS", "BOOKMYSHOW", 
        "SPOTIFY INDIA", "YOUTUBE PREMIUM"
    ],
    "Utilities": [
        "AIRTEL BILL", "JIO RECHARGE", "BESCOM ELECTRIC", "ADANI GAS", 
        "TATA PLAY"
    ],
    "Rent": [
        "NOBROKER RENT", "HOUSING COM RENT", "CRED RENT"
    ],
    "EMI": [
        "HDFC BANK EMI", "ICICI LOAN", "SBI CARD EMI", "BAJAJ FINSERV"
    ],
    "Groceries": [
        "BIGBASKET", "BLINKIT", "ZEPTO", "DUNZO", "RELIANCE FRESH"
    ]
}

def generate_synthetic_data(num_users=5, months=6):
    all_transactions = []
    merchant_labels = []
    
    # Generate labels for merchant classifier
    for cat, merchants in MERCHANT_CATEGORIES.items():
        for m in merchants:
            merchant_labels.append({"merchant": f"{m} {random.randint(100, 999)}", "category": cat})
    
    start_date = datetime.now() - timedelta(days=months*30)
    
    for user_id in range(num_users):
        user_str = f"user_{user_id}"
        current_date = start_date
        
        while current_date < datetime.now():
            # Generate 5-15 transactions per week
            for _ in range(random.randint(5, 15)):
                cat = random.choice(list(MERCHANT_CATEGORIES.keys()))
                merchant_base = random.choice(MERCHANT_CATEGORIES[cat])
                merchant_name = f"{merchant_base} {random.randint(1000, 9999)}"
                
                amount = random.uniform(100, 5000)
                if cat == "Rent":
                    amount = random.uniform(20000, 50000)
                elif cat == "EMI":
                    amount = random.uniform(5000, 15000)
                
                all_transactions.append({
                    "user_id": user_str,
                    "merchant": merchant_name,
                    "amount": round(amount, 2),
                    "category": cat,
                    "date": current_date.strftime("%Y-%m-%d"),
                    "type": "DEBIT"
                })
                current_date += timedelta(hours=random.randint(1, 48))
            
            current_date += timedelta(days=random.randint(1, 3))

    return all_transactions, merchant_labels

if __name__ == "__main__":
    txs, labels = generate_synthetic_data()
    
    import os
    os.makedirs("ml/data", exist_ok=True)
    
    with open("ml/data/sample_transactions.json", "w") as f:
        json.dump(txs, f, indent=2)
        
    pd.DataFrame(labels).to_csv("ml/data/merchant_labels.csv", index=False)
    print(f"Generated {len(txs)} transactions and {len(labels)} merchant labels.")
