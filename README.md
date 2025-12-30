# AI Stock Prediction Platform

An AI-powered stock prediction web application that combines technical analysis, modern portfolio theory, and market sentiment analysis to provide comprehensive investment insights. Built for personal use with sharing capabilities for friends and colleagues.

## Features

- **Multi-dimensional Analysis**: Technical indicators (RSI, MACD, Bollinger Bands), portfolio theory metrics (beta, alpha, Sharpe ratio), and sentiment analysis
- **AI-Enhanced Insights**: LLM-powered explanations of technical patterns, market conditions, and strategy recommendations
- **Backtesting Engine**: Historical strategy validation with performance metrics and AI-generated analysis
- **Watchlist Management**: Personal stock tracking with real-time predictions and alerts
- **Responsive Web Interface**: Mobile-optimized Next.js application with real-time data updates

### Planned Features

- **Trading Journal & P&L Tracker**: Log trades (paper or real), track profit/loss, and analyze trading performance based on platform predictions (see `.kiro/specs/trading-journal/`)

## Tech Stack

- **Frontend**: Next.js 15.4.6 with React 19, Tailwind CSS v4, TypeScript
- **Backend**: PostgreSQL with custom connection pooling, AWS Secrets Manager
- **Infrastructure**: AWS CDK v2, Aurora Serverless v2, Lambda, S3
- **Analysis**: Custom TypeScript engine with `technicalindicators` and `simple-statistics`
- **Testing**: Vitest with UI support

## Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- AWS account (for production deployment)

### Development Setup

1. **Install dependencies**:
```bash
npm install
```

2. **Set up environment variables**:
```bash
# Copy the environment template
cp .env.local.example .env.local
```

3. **Get a Financial Modeling Prep API key**:
   - Visit [Financial Modeling Prep](https://financialmodelingprep.com/developer/docs)
   - Sign up for a free account (500 requests/day)
   - Copy your API key from the dashboard
   - Add it to `.env.local`:
   ```bash
   FMP_API_KEY=your_actual_api_key_here
   ```

4. **Initialize database** (optional for basic functionality):
```bash
npm run db:setup
```

5. **Start development server**:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Available Scripts

### Development
```bash
npm run dev          # Start development server with Turbopack
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Database Operations
```bash
npm run db:setup     # Initialize database and run migrations
npm run db:migrate   # Run pending migrations
npm run db:seed      # Seed development data
npm run db:health    # Check database connectivity
npm run db:migrate:status  # Check migration status
npm run db:migrate:reset   # Reset and re-run all migrations
```

### Testing
```bash
npm run test         # Run tests in watch mode
npm run test:run     # Run tests once
npm run test:ui      # Open Vitest UI
```

## Project Structure

```
ai-stock-prediction/
├── src/
│   ├── app/                    # Next.js App Router
│   │   └── api/               # API routes
│   ├── components/             # React components
│   │   ├── dashboard/         # Dashboard-specific
│   │   │   └── hooks/         # Custom hooks (usePredictions, useStockAnalysis)
│   │   └── __tests__/         # Component tests
│   ├── hooks/                  # Shared custom hooks
│   ├── lib/
│   │   ├── technical-analysis/ # Technical indicators engine
│   │   ├── database/          # Database connection & migrations
│   │   ├── data-providers/    # FMP API integration
│   │   ├── ai/                # LLM integration
│   │   └── portfolio/         # Portfolio theory calculations
│   └── types/                 # TypeScript definitions
│       └── predictions.ts     # Centralized prediction types
├── infrastructure/            # AWS CDK infrastructure code
└── public/                   # Static assets
```

## Core Components

### Technical Analysis Engine
- **RSI, MACD, Bollinger Bands**: Classic momentum and volatility indicators
- **Moving Averages**: SMA/EMA with crossover signals
- **Volume Analysis**: OBV, VPT, Accumulation/Distribution
- **Momentum Indicators**: Stochastic, Williams %R, ADX

### Database Schema
- Stock price data with OHLCV format
- User watchlists and preferences
- Analysis results caching
- Migration system for schema updates

### AI Integration
- Pattern recognition explanations
- Market condition analysis
- Strategy recommendations
- Backtesting insights

## Infrastructure Deployment

The application uses AWS CDK for infrastructure as code:

```bash
cd infrastructure
npm install
npm run build
npm run deploy
```

This deploys:
- Aurora Serverless v2 database
- Lambda functions for data processing
- S3 bucket for data lake storage
- CloudWatch monitoring and alarms

## Learn More

### Next.js Resources
- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial

### Financial Analysis
- [Technical Analysis Library](https://github.com/anandanand84/technicalindicators) - indicators implementation
- [Modern Portfolio Theory](https://en.wikipedia.org/wiki/Modern_portfolio_theory) - theoretical foundation

## Contributing

This is a personal project, but feedback and suggestions are welcome. Please ensure all tests pass before submitting any changes:

```bash
npm run test:run
npm run lint
```
