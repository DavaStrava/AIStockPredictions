# AI Stock Prediction Platform

An AI-powered stock prediction web application that combines technical analysis, modern portfolio theory, and market sentiment analysis to provide comprehensive investment insights. Built for personal use with sharing capabilities for friends and colleagues.

## Features

- **Multi-dimensional Analysis**: Technical indicators (RSI, MACD, Bollinger Bands), portfolio theory metrics (beta, alpha, Sharpe ratio), and sentiment analysis
- **AI-Enhanced Insights**: LLM-powered explanations of technical patterns, market conditions, and strategy recommendations
- **Type-Safe API**: Zod-validated requests with automatic TypeScript types and consistent error responses
- **Rate Limiting**: Built-in protection against API abuse with configurable limits per endpoint
- **Backtesting Engine**: Historical strategy validation with performance metrics and AI-generated analysis
- **Watchlist Management**: Personal stock tracking with real-time predictions and alerts
- **Responsive Web Interface**: Mobile-optimized Next.js application with real-time data updates

### Trading Journal & P&L Tracker ✅ Complete

- **Trade Logging**: Log paper or real trades with symbol, side (LONG/SHORT), entry price, quantity, and fees
- **P&L Tracking**: Automatic calculation of realized P&L (closed trades) and unrealized P&L (open positions)
- **Portfolio Statistics**: Win rate, average win/loss, total P&L, best/worst trade metrics
- **Trade Management**: View, filter, sort, and close trades through a dedicated interface
- **Dashboard Integration**: "Log Trade" button on prediction cards for quick trade entry
- **Full API Integration**: Complete REST API with validation, rate limiting, and error handling

### Portfolio Investment Tracker ✅ NEW

A comprehensive long-term investment tracking system, distinct from the Trading Journal:

- **Multi-Portfolio Support**: Create and manage multiple investment portfolios
- **Transaction Logging**: BUY, SELL, DEPOSIT, WITHDRAW, DIVIDEND transactions with validation
- **Real-time Holdings**: Live market data integration showing current prices, day change, total return
- **Target Allocations**: Set target percentages per holding with drift calculations
- **Rebalancing Suggestions**: Automated recommendations when holdings drift from targets
- **Sector Allocation**: Interactive tree map visualization of portfolio breakdown
- **Performance History**: Equity curve chart with S&P 500 benchmark comparison
- **Key Metrics**: Total equity, cash balance, day change, daily alpha (vs S&P 500)

## Tech Stack

- **Frontend**: Next.js 15.5.9 with React 19, Tailwind CSS v4, TypeScript
- **Backend**: PostgreSQL with custom connection pooling, AWS Secrets Manager
- **Authentication**: Supabase Auth with Google/GitHub OAuth
- **Database**: Supabase PostgreSQL (production) / Local PostgreSQL (development)
- **API Middleware**: Composable middleware for error handling, validation, rate limiting, logging
- **Validation**: Zod for type-safe schema validation with automatic TypeScript types
- **Infrastructure**: AWS CDK v2, Aurora Serverless v2, Lambda, S3
- **Hosting**: Vercel (production) with auto-deployment from GitHub
- **Analysis**: Custom TypeScript engine with `technicalindicators` and `simple-statistics`
- **Testing**: Vitest with UI support, property-based testing with fast-check

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

## API Development

For API development and middleware usage, see:
- **[API Middleware Guide](docs/API_MIDDLEWARE_GUIDE.md)** - Complete middleware reference
- **[Migration Example](docs/MIGRATION_EXAMPLE.md)** - Step-by-step migration guide
- **[Refactoring Plan](REFACTORING_PLAN.md)** - Comprehensive improvement roadmap

## Troubleshooting

### Database Connection Issues

If you see errors like "Database connection unavailable" or "Database tables not found":

1. **Ensure PostgreSQL is running**:
   ```bash
   # Check if PostgreSQL is running
   pg_isready
   ```

2. **Run database setup**:
   ```bash
   npm run db:setup
   ```

3. **Check database health**:
   ```bash
   npm run db:health
   ```

4. **Run migrations if tables are missing**:
   ```bash
   npm run db:migrate
   ```

### Trading Journal API Errors

The `/api/trades/stats` endpoint returns specific error codes:
- **503**: Database unavailable - run `npm run db:setup`
- **503**: Missing tables - run `npm run db:migrate`
- **500**: Unexpected server error - check logs for details

### Portfolio Investment Tracker API Errors

The `/api/portfolios` endpoints return specific error codes:
- **400**: Invalid input data (empty name, invalid transaction type, negative amounts)
- **400**: Insufficient funds for BUY or insufficient shares for SELL
- **404**: Portfolio or holding not found
- **503**: Database unavailable - run `npm run db:setup`
- **503**: Missing tables - run `npm run db:migrate`
- **500**: Unexpected server error - check logs for details

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
│   │       ├── trades/        # Trading journal endpoints (migrated to middleware)
│   │       └── portfolios/    # Portfolio tracker endpoints ✅ NEW
│   ├── components/             # React components
│   │   ├── dashboard/         # Dashboard-specific
│   │   │   └── hooks/         # Custom hooks (usePredictions, useStockAnalysis)
│   │   ├── trading-journal/   # Trading journal components
│   │   │   └── hooks/         # usePortfolioStats hook
│   │   ├── portfolio/         # Portfolio investment tracker ✅ NEW
│   │   │   └── hooks/         # usePortfolio hook
│   │   └── __tests__/         # Component tests
│   ├── hooks/                  # Shared custom hooks
│   ├── lib/
│   │   ├── api/               # API middleware & validation
│   │   │   ├── middleware.ts  # Composable middleware functions
│   │   │   └── client.ts      # Typed API client (future)
│   │   ├── validation/        # Zod schemas for type-safe validation
│   │   ├── technical-analysis/ # Technical indicators engine
│   │   ├── database/          # Database connection & migrations
│   │   ├── data-providers/    # FMP API integration
│   │   ├── ai/                # LLM integration
│   │   └── portfolio/         # TradeService & PortfolioService
│   └── types/                 # TypeScript definitions
│       ├── predictions.ts     # Centralized prediction types
│       └── portfolio.ts       # Portfolio tracker types ✅ NEW
├── docs/                      # Documentation
│   ├── API_MIDDLEWARE_GUIDE.md       # Complete middleware reference
│   ├── MIGRATION_EXAMPLE.md          # Step-by-step migration
│   └── MIDDLEWARE_REFACTORING_SUMMARY.md  # Impact analysis
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
- Trade records with P&L tracking
- Portfolio investment tracking (portfolios, transactions, holdings, daily snapshots)
- Analysis results caching
- Migration system for schema updates (3 migration files)

### AI Integration
- Pattern recognition explanations
- Market condition analysis
- Strategy recommendations
- Backtesting insights

## Cloud Deployment (Free Tier)

### Prerequisites
1. Create a [Supabase](https://supabase.com) account (free tier)
2. Create a [Vercel](https://vercel.com) account (free tier)

### Supabase Setup

1. **Create a new Supabase project**
2. **Enable Google OAuth**:
   - Go to Authentication > Providers > Google
   - Add your Google OAuth credentials (from [Google Cloud Console](https://console.cloud.google.com))
3. **Get your credentials**:
   - Project URL: `https://your-project.supabase.co`
   - Anon Key: Settings > API > Project API keys > anon
   - Database URL: Settings > Database > Connection string (URI)
4. **Run database migrations**:
   - Connect to the SQL Editor and run the contents of:
     - `src/lib/database/migrations/001_initial_schema.sql`
     - `src/lib/database/migrations/002_trades_schema.sql`
     - `src/lib/database/migrations/003_portfolio_schema.sql`

### Vercel Deployment

1. **Connect your GitHub repository to Vercel**
2. **Configure environment variables**:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   DATABASE_URL=postgresql://...@db.your-project.supabase.co:5432/postgres
   FMP_API_KEY=your-fmp-api-key
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```
3. **Deploy**: Push to main branch or trigger manual deploy

### Cost Estimate

| Service | Tier | Monthly Cost |
|---------|------|--------------|
| Vercel | Hobby | $0 |
| Supabase | Free | $0 |
| FMP API | Free | $0 |
| **Total** | - | **$0/month** |

## Infrastructure Deployment (AWS - Optional)

The application includes AWS CDK for enterprise infrastructure:

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
