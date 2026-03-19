import json
import os

class CardRecommender:
    def __init__(self, config_path="ml/data/cards_config.json"):
        self.config_path = config_path
        self.matrix = {}
        self.load()

    def load(self):
        if os.path.exists(self.config_path):
            with open(self.config_path, "r") as f:
                self.matrix = json.load(f)

    def recommend_card(self, merchant: str, category: str, amount: float, user_cards: list) -> list:
        recommendations = []
        
        for card_name in user_cards:
            if card_name not in self.matrix:
                # Fallback for unknown cards
                recommendations.append({
                    "card": card_name,
                    "score": 1.0,
                    "estimated_cashback": amount * 0.01
                })
                continue
            
            rules = self.matrix[card_name]
            score = rules.get("Default", 1.0)
            
            # check merchant specific rules
            for m_key, m_score in rules.items():
                if m_key.lower() in merchant.lower():
                    score = m_score
                    break
            
            # if still default, check category
            if score == rules.get("Default") and category in rules:
                score = rules[category]
                
            recommendations.append({
                "card": card_name,
                "score": float(score),
                "estimated_cashback": float(amount * (score / 100))
            })
            
        # Sort by estimated cashback
        return sorted(recommendations, key=lambda x: x['estimated_cashback'], reverse=True)
