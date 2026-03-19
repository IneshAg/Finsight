# FinSight

FinSight is a personal finance insights dashboard powered by Machine Learning. It provides users with smart financial analytics, risk forecasting, and subscription management tools to make better financial decisions.

## Features

- **Dashboard**: Get an overview of your financial health, recent transactions, and key metrics.
- **Risk Forecast**: Benefit from ML-driven predictions for upcoming expenses and budget risk analysis.
- **Subscriptions Management**: Automatically detect and track recurring subscriptions, allowing you to easily identify and cancel unwanted services.
- **Insights & Anomalies**: Get notified about unusual spending patterns or anomalies in your transactions.

## Tech Stack

**Frontend**
- React + Vite
- Tailwind CSS

**Backend**
- Python / FastAPI
- SQLite
- Machine Learning models for forecasting and anomaly detection

## Setup & Installation

### Prerequisites
- Node.js
- Python 3.9+

### Backend Setup
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the FastAPI development server:
   ```bash
   python -m uvicorn main:app --reload
   ```

### Frontend Setup
1. Navigate to the `finsight-frontend` directory:
   ```bash
   cd finsight-frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```

## Project Structure
- `/finsight-frontend/`: Contains the frontend React application, configured with Vite and initialized with routing and Tailwind CSS.
- `/backend/`: Contains the backend logic written with FastAPI. This directory houses the API routers, SQL database configuration, Machine Learning scripts, and data generation utilities.
