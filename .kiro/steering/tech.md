# Technology Stack & Development Guide

## Core Technologies
- **Frontend**: Next.js 15.4.6 with React 19, App Router
- **Styling**: Tailwind CSS v4 with dark mode support
- **Language**: TypeScript with strict mode enabled
- **Database**: PostgreSQL with custom connection pooling
- **Cloud**: AWS (Aurora Serverless v2, Lambda, S3, Secrets Manager)
- **Infrastructure**: AWS CDK v2 for Infrastructure as Code
- **Testing**: Vitest with UI support
- **Analysis Libraries**: `technicalindicators`, `simple-statistics`

## Development Commands

### Core Development
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

### Infrastructure Deployment
```bash
cd infrastructure
npm install
npm run build
npm run deploy       # Deploy to AWS
npm run destroy      # Tear down infrastructure
npm run synth        # Generate CloudFormation templates
```

## Key Libraries & Frameworks

### Frontend Stack
- **Next.js 15**: App Router, Server Components, API Routes
- **React 19**: Latest features with concurrent rendering
- **Tailwind CSS v4**: Utility-first styling with custom design system
- **Recharts**: Data visualization for stock charts
- **Lucide React**: Icon library for UI components

### Backend & Data
- **PostgreSQL**: Primary database with connection pooling
- **AWS SDK**: Secrets Manager integration for secure credentials
- **technicalindicators**: RSI, MACD, Bollinger Bands calculations
- **simple-statistics**: Statistical analysis and portfolio metrics

### Development Tools
- **TypeScript**: Strict type checking with path aliases (@/*)
- **Vitest**: Fast testing framework with native TypeScript support
- **ESLint**: Code linting with Next.js and TypeScript rules
- **tsx**: TypeScript execution for CLI tools and scripts

## Configuration Files
- `next.config.ts`: Next.js configuration with optimization settings
- `tsconfig.json`: TypeScript configuration with strict mode and path aliases
- `vitest.config.ts`: Test configuration with global APIs and path resolution
- `eslint.config.mjs`: ESM-based ESLint configuration
- `tailwind.config.js`: Tailwind CSS customization (if present)

## Environment Setup
- Node.js 18+ required
- PostgreSQL database (local or AWS Aurora)
- AWS account for production deployment
- Environment variables in `.env.local` for development