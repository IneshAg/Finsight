import json
import os

BASE = os.path.join(os.path.dirname(__file__), '..', 'datasets')

def list_available_profiles():
    base = BASE
    profiles = []
    if os.path.exists(base):
        for d in os.listdir(base):
            if os.path.isdir(os.path.join(base, d)):
                try:
                    with open(os.path.join(base, d, "profile.json")) as f:
                        p = json.load(f)
                        profiles.append({
                            "folder": d,
                            "name": p.get("profile_name", d),
                            "description": p.get("description", "")
                        })
                except Exception:
                    pass
    return profiles

def load_profile(profile_folder='priya_sharma'):
    with open(os.path.join(BASE, profile_folder, "profile.json")) as f:
        return json.load(f)

def load_all_quarters(profile_folder='priya_sharma'):
    base = os.path.join(BASE, profile_folder)
    with open(os.path.join(base, 'profile.json')) as f:
        profile = json.load(f)
    all_transactions = []
    quarterly_summaries = []
    for qfile in profile['quarters']:
        with open(os.path.join(base, qfile)) as f:
            quarter = json.load(f)
        all_transactions.extend(quarter['transactions'])
        quarterly_summaries.append({
            'filename': qfile,
            'quarter': quarter['quarter'],
            'label': quarter['label'],
            'is_current': quarter['is_current'],
            'summary': quarter['quarter_summary'],
            'transactions': quarter['transactions']
        })
    return {
        'profile': profile,
        'all_transactions': all_transactions,
        'quarterly_summaries': quarterly_summaries
    }

def load_current_quarter(profile_folder='priya_sharma'):
    base = os.path.join(BASE, profile_folder)
    with open(os.path.join(base, 'profile.json')) as f:
        profile = json.load(f)
    with open(os.path.join(base, profile['current_quarter'])) as f:
        q = json.load(f)
    return q['transactions']

def load_specific_quarter(profile_folder, quarter_file):
    base = os.path.join(BASE, profile_folder)
    with open(os.path.join(base, quarter_file)) as f:
        q = json.load(f)
    return q
