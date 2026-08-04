# 🛡️ Ledgerly — Private Personal Financial Dashboard

Ledgerly is a complete, private, mobile-friendly personal financial dashboard for tracking expenses, income, budgets, goals, recurring bills, and documents in **₹ (INR)** with custom dark mode aesthetics.

![Ledgerly Financial Dashboard](https://raw.githubusercontent.com/placeholder/ledgerly/main/preview.png)

---

## 🌟 Key Features

- **📊 Comprehensive Financial Overview**: Track Net Worth, Income, Spending, and Savings Rate with real-time Recharts visualizations.
- **💸 Single & Batch Transactions**: Search, filter by category/account, edit inline category dropdowns, manage tag pills, and flag receipts.
- **🔄 Auto-Recurring & Subscriptions Detection**: Intelligent algorithm normalizes merchant names, classifies cadence windows (weekly to annual), and calculates monthly/annual commitments.
- **🎯 Category Budgets & Savings Goals**: Real-time progress bars, budget utilization rings, remaining balances, and target dates.
- **📂 R2 Storage & Google Drive Inbox**: Store receipts/documents up to 20MB in object storage; automated daily sync at 8:00 AM IST for `Ledgerly Financial Inbox`.
- **🌙 Premium Dark & Light Themes**: Sleek dark slate theme enabled by default with a top-bar theme toggle button.
- **🔒 Private & Durable Storage**: Centralized duplicate fingerprint detector (`date|merchant|amount|account`) prevents duplicate entries.

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or higher installed on your computer.

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/ledgerly.git
   cd ledgerly
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start Development / Application Server**:
   ```bash
   npm run dev:all
   ```
   This single command starts both the **Backend API (port 3001)** and **Frontend UI (port 3000)** concurrently!

4. Open your browser to:
   **`http://localhost:3000`**

---

## 📁 Repository Structure

```text
ledgerly/
├── data/                    # Database storage directory (git-ignored for privacy)
│   └── db.json              # Local D1 database storage driver
├── storage/                 # Binary object storage directory (git-ignored)
│   └── r2/                  # Local R2 object storage driver (receipts/documents)
├── server/
│   ├── index.js             # Express API Server endpoints (/api/*)
│   └── db.js                # Database engine & fingerprint duplicate detector
├── src/
│   ├── components/          # Tab views (Dashboard, Transactions, Budgets, etc.)
│   ├── utils/               # Recurring detection engine & CSV bank statement parser
│   ├── App.jsx              # Main application shell & state routing
│   ├── index.css            # Dark/Light CSS design system tokens
│   └── main.jsx             # React entry point
├── scripts/
│   └── verify_ledgerly.js   # Automated integration test suite
├── package.json
├── vite.config.js
└── README.md
```

---

## ☁️ Deployment Options (Access Anywhere)

### Option 1: Free Live Cloud Hosting (Render / Railway / Koyeb)
1. Push your repository to **GitHub**.
2. Sign up at [Render.com](https://render.com/) or [Railway.app](https://railway.app/).
3. Create a **Web Service**, connect your GitHub repo `ledgerly`.
4. Set Build Command: `npm install && npx vite build`
5. Set Start Command: `node server/index.js`
6. Click **Deploy**. Your app will be live at `https://ledgerly.onrender.com` accessible from any phone or computer!

---

## 📜 License
Private Owner License. Free for personal financial tracking.

# Ledgerly-Financial-Service