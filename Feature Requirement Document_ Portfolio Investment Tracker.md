---

# **Feature Requirement Document: Portfolio Investment Tracker**

Project: AI Stock Prediction Platform

Version: 2.0 (Consolidated Master)

Date: January 1, 2026

Status: Approved for Development

Author: Product Engineering Team

---

## **1\. Executive Summary**

The **Portfolio Investment Tracker** is a wealth management feature designed to manage long-term investment collections. Distinct from the existing *Trading Journal* (which focuses on transactional execution and win rates), this system focuses on **state** (current holdings), **allocation** (diversity), and **history** (equity curve).

It enables users to organize investments into distinct portfolios (e.g., "Retirement," "High Growth") and track granular performance metrics. Key capabilities include robust transaction logging (deposits, withdrawals, dividends), real-time asset valuation, and advanced analytics such as sector tree maps and benchmark comparisons (S\&P 500/Nasdaq).

---

## **2\. User Stories**

### **Core Management**

| ID | As a... | I want to... | So that I can... |
| :---- | :---- | :---- | :---- |
| **US-1** | Investor | Create multiple named portfolios | Separate my safe long-term investments from high-risk bets or different brokerage accounts. |
| **US-2** | Investor | Track cash buying power | Monitor "dry powder" availability specifically for each portfolio via Deposit/Withdrawal logging. |
| **US-3** | Investor | Manually override average cost basis | Correct data imported from legacy brokerages without needing to manually enter years of historical trade history. |

### **Analytics & Performance**

| ID | As a... | I want to... | So that I can... |
| :---- | :---- | :---- | :---- |
| **US-4** | Investor | View my total portfolio value history (Equity Curve) | Visualize wealth growth over time, independent of individual trade outcomes. |
| **US-5** | Investor | Compare performance against benchmarks | Determine if my portfolio is generating alpha compared to the S\&P 500 (SPY) or Nasdaq (QQQ). |
| **US-6** | Investor | View asset allocation via a Tree Map | Instantly identify concentration risks (e.g., "Too much exposure to Tech sector"). |
| **US-7** | Investor | Set target allocations | Define ideal weights (e.g., "AAPL should be 10%") and receive alerts when rebalancing is needed. |

---

## **3\. Detailed Metrics Specification**

The system must calculate and display the following metrics with high precision.

### **3.1 Individual Asset Metrics (The "Holdings" Grid)**

*These metrics apply to every row in the holdings table.*

| Metric | Display Name | Formula / Logic | Format |
| :---- | :---- | :---- | :---- |
| **Quantity** | Shares | Sum(Buy Qty) \- Sum(Sell Qty) | 125.50 |
| **Current Price** | Price | Real-time quote from FMP API | $145.20 |
| **Average Cost** | Avg Cost | Total Cost Basis / Quantity (FIFO or Weighted Avg) | $130.00 |
| **Market Value** | Value | Quantity \* Current Price | $18,222.60 |
| **Portfolio Weight** | % of Port | (Market Value / Total Equity) \* 100 | 12.5% |
| **Target Weight** | Target % | User-defined target allocation | 10.0% |
| **Drift** | Drift % | Portfolio Weight \- Target Weight | \+2.5% |
| **Day Change ($)** | Day G/L $ | (Current Price \- Prev Close) \* Quantity | \+$250.00 |
| **Sector** | Sector | Retrieved from Asset Profile (e.g., "Technology") | Text |

### **3.2 Aggregate Portfolio Metrics (The Dashboard Header)**

* **Total Equity:** Sum(All Asset Market Values) \+ Cash Balance  
* **Cash Balance:** Total Deposits \- Total Withdrawals \- Net Cost of Trades \+ Dividends  
* **Day Change:** Sum(All Assets Day Change $)  
* **Total Return (All Time):** (Current Equity \- Net Deposits)  
* **Daily Alpha:** Portfolio Day Change % \- S\&P 500 Day Change %

---

## **4\. Functional Requirements**

### **4.1 Portfolio Management & Transactions**

* **FR-1.1:** Users can create, rename, delete, and switch between portfolios.  
* **FR-1.2:** System supports specific transaction types:  
  * BUY / SELL: Affects share count and cash balance.  
  * DEPOSIT / WITHDRAWAL: Affects cash balance only.  
  * DIVIDEND: Increases cash balance; linked to a specific symbol.  
* **FR-1.3:** System must maintain a "Current Holdings" cache to avoid recalculating entire history on every page load.

### **4.2 Advanced Analysis & Visualization**

* **FR-2.1 (Tree Map):** Visualize allocation using a block chart.  
  * **Block Size:** Corresponds to Portfolio Weight.  
  * **Block Color:** Corresponds to Day Change % (Green/Red heatmap).  
* **FR-2.2 (Equity Curve):** A line chart tracking Total Portfolio Value daily.  
  * *Requirement:* Must reconstruct history using historical daily close prices for all held assets.  
* **FR-2.3 (Benchmarking):** Overlay comparison lines (SPY, QQQ) normalized to the portfolio's start date (percentage growth view).  
* **FR-2.4 (Rebalancing):** Automatically highlight rows in the grid where Drift % exceeds a user-defined threshold (e.g., \> 2%).

---

## **5\. Technical Design**

### **5.1 Database Schema**

New tables required in PostgreSQL.

SQL  
\-- 1\. Portfolios Table  
CREATE TABLE portfolios (  
  id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
  user\_id UUID NOT NULL,  
  name VARCHAR(255) NOT NULL,  
  description TEXT,  
  currency VARCHAR(3) DEFAULT 'USD',  
  created\_at TIMESTAMP DEFAULT NOW()  
);

\-- 2\. Portfolio Transactions (Source of Truth)  
CREATE TABLE portfolio\_transactions (  
  id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
  portfolio\_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,  
  asset\_symbol VARCHAR(20), \-- Null for Cash ops  
  transaction\_type VARCHAR(20) NOT NULL, \-- 'BUY', 'SELL', 'DEPOSIT', 'WITHDRAW', 'DIVIDEND'  
  quantity DECIMAL(18, 8),  
  price\_per\_share DECIMAL(18, 4),  
  fees DECIMAL(10, 2\) DEFAULT 0,  
  total\_amount DECIMAL(18, 4\) NOT NULL, \-- Net cash impact  
  transaction\_date TIMESTAMP NOT NULL,  
  notes TEXT  
);

\-- 3\. Current Holdings Cache (Performance Optimization)  
CREATE TABLE portfolio\_holdings (  
    id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
    portfolio\_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,  
    symbol VARCHAR(20) NOT NULL,  
    quantity DECIMAL(18, 8\) NOT NULL,  
    average\_buy\_price DECIMAL(18, 4\) NOT NULL,  
    total\_cost\_basis DECIMAL(18, 4\) NOT NULL,  
    target\_allocation\_percent DECIMAL(5, 2), \-- User defined target  
    sector VARCHAR(50),   
    updated\_at TIMESTAMP DEFAULT NOW(),  
    UNIQUE(portfolio\_id, symbol)  
);

\-- 4\. Daily Snapshots (History & Benchmarking)  
CREATE TABLE portfolio\_daily\_performance (  
    id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
    portfolio\_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,  
    date DATE NOT NULL,  
    total\_equity DECIMAL(18, 2\) NOT NULL,  
    cash\_balance DECIMAL(18, 2\) NOT NULL,  
    daily\_return\_percent DECIMAL(10, 4),  
    benchmark\_spy\_price DECIMAL(10, 2), \-- Store SPY close for reference  
    UNIQUE(portfolio\_id, date)  
);

### **5.2 API Architecture**

| Endpoint | Method | Purpose |
| :---- | :---- | :---- |
| /api/portfolios | GET/POST | List user portfolios / Create new portfolio |
| /api/portfolios/\[id\]/summary | GET | Fetch header stats (Equity, Cash, Day Change) |
| /api/portfolios/\[id\]/holdings | GET | Fetch detailed grid data (merged with live FMP quotes) |
| /api/portfolios/\[id\]/transactions | POST | Log new transaction (triggers cache update) |
| /api/portfolios/\[id\]/history | GET | Fetch time-series data for Equity Curve & Benchmarks |
| /api/portfolios/\[id\]/rebalance | GET | Calculate rebalancing suggestions based on targets |

### **5.3 UI Component Architecture**

Located in src/components/portfolio/:

1. **PortfolioSummaryCard**: Displays high-level stats (Total Equity, Day Change, Alpha).  
2. **HoldingsDataGrid**:  
   * **Library:** TanStack Table.  
   * **Features:** Sorting, filtering, custom cell rendering (Sparklines, colored P\&L).  
   * **Columns:** Symbol, Sparkline (7d), Price, Value, Weight (Bar), Target, Day G/L, Total Return.  
3. **PortfolioTreeMap**: Interactive block visualization (Sector/Asset hierarchy).  
4. **PerformanceChart**: Line chart (Recharts) with toggles for "My Portfolio", "S\&P 500", "Nasdaq".  
5. **TradeEntryModal**: Form for entering Buy/Sell/Deposit/Withdrawal.

---

## **6\. Implementation Plan**

### **Phase 1: Foundation (Database & CRUD)**

1. **Migration:** Execute SQL scripts for portfolios, transactions, holdings, snapshots.  
2. **Service Layer:** Build PortfolioService to handle addTransaction logic (ensuring cash balance updates, cost basis calculation, and holdings cache updates).  
3. **API:** Implement basic GET/POST endpoints.

### **Phase 2: The "Rich" Grid**

1. **Data Integration:** Integrate FMP getQuote (batch request) to value all holdings in real-time.  
2. **UI Development:** Build HoldingsDataGrid with sorting, filtering, and calculated columns (Weight, Drift).

### **Phase 3: Analytics & Visualization**

1. **History Engine:** Implement a script to "replay" transaction history or backfill portfolio\_daily\_performance using historical FMP data.  
2. **Charts:** Build the Tree Map and Benchmark-compare Line Chart using Recharts.

