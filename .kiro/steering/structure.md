# Project Structure & Organization

## Root Directory Structure
```
ai-stock-prediction/
├── src/                    # Main application source code
├── infrastructure/         # AWS CDK infrastructure code
├── public/                # Static assets (SVGs, images)
├── .kiro/                 # Kiro AI assistant configuration
├── .next/                 # Next.js build output (auto-generated)
├── node_modules/          # Dependencies (auto-generated)
└── [config files]         # Various configuration files
```

## Source Code Organization (`src/`)

### App Router Structure (`src/app/`)
- **`layout.tsx`**: Root layout with error boundaries and font configuration
- **`page.tsx`**: Main dashboard page
- **`globals.css`**: Global styles and Tailwind CSS imports
- **`api/`**: Next.js API routes for backend functionality
  - `analysis/route.ts`: Technical analysis endpoint
  - `predictions/route.ts`: Stock prediction endpoint
  - `insights/route.ts`: AI-powered insights
  - `search/route.ts`: Stock search functionality
  - `watchlists/`: Watchlist management endpoints
  - `market-indices/`: Market index data endpoints

### Component Architecture (`src/components/`)
- **Dashboard Components**: `StockDashboard.tsx`, `StockChart.tsx`, `AdvancedStockChart.tsx`
- **Analysis Components**: `AIInsights.tsx`, `PerformanceMetrics.tsx`, `MarketIndexAnalysis.tsx`
- **UI Components**: `StockSearch.tsx`, `WatchlistManager.tsx`, `CollapsibleSection.tsx`
- **Utility Components**: `ErrorBoundary.tsx`, `DevErrorDashboard.tsx`, `TermsGlossary.tsx`

### Library Structure (`src/lib/`)
- **`technical-analysis/`**: Core analysis engine
  - `engine.ts`: Main TechnicalAnalysisEngine class
  - `indicators/`: Individual technical indicators (RSI, MACD, etc.)
  - `types.ts`: TypeScript interfaces and types
  - `utils.ts`: Utility functions for data processing
  - `__tests__/`: Unit tests for the analysis engine
- **`database/`**: Database connection and management
  - `connection.ts`: PostgreSQL connection pooling
  - `migrate.ts`: Database migration system
  - `cli.ts`: Command-line database tools
  - `migrations/`: SQL migration files
  - `services/`: Database service layers
- **`data-providers/`**: External data source integrations
- **`ai/`**: LLM provider integrations
- **`portfolio/`**: Portfolio theory calculations
- **`knowledge/`**: Financial definitions and glossary

### Type Definitions (`src/types/`)
- **`index.ts`**: General application types
- **`models.ts`**: Data model interfaces
- **`api.ts`**: API request/response types
- **`technical-indicators.ts`**: Technical analysis specific types

## Infrastructure Code (`infrastructure/`)
- **`lib/`**: CDK stack definitions
  - `ai-stock-prediction-stack.ts`: Main application stack
  - `database-stack.ts`: Aurora Serverless database
  - `s3-stack.ts`: S3 bucket for data storage
- **`bin/`**: CDK application entry points
- **`cdk.json`**: CDK configuration
- **Separate `package.json`**: Infrastructure-specific dependencies

## Configuration Files

### TypeScript Configuration
- **`tsconfig.json`**: Main TypeScript config with path aliases (`@/*` → `./src/*`)
- **`infrastructure/tsconfig.json`**: Separate config for CDK code

### Build & Development
- **`next.config.ts`**: Next.js configuration with optimizations
- **`vitest.config.ts`**: Test configuration with path resolution
- **`eslint.config.mjs`**: ESM-based linting configuration
- **`postcss.config.mjs`**: PostCSS configuration for Tailwind

### Package Management
- **`package.json`**: Main application dependencies and scripts
- **`infrastructure/package.json`**: CDK-specific dependencies

## Naming Conventions

### Files & Directories
- **Components**: PascalCase (e.g., `StockDashboard.tsx`)
- **API Routes**: kebab-case directories with `route.ts` files
- **Utilities**: camelCase (e.g., `connection.ts`, `engine.ts`)
- **Types**: kebab-case with descriptive names (e.g., `technical-indicators.ts`)

### Code Conventions
- **Interfaces**: PascalCase with descriptive names (e.g., `TechnicalAnalysisResult`)
- **Functions**: camelCase with verb-noun pattern (e.g., `analyzeRSI`, `fetchPredictions`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `DEFAULT_CONFIG`)
- **CSS Classes**: Tailwind utility classes with responsive prefixes

## Import Path Patterns
- **Absolute imports**: Use `@/` alias for all internal imports
- **External libraries**: Direct imports from node_modules
- **Type-only imports**: Use `import type` for TypeScript interfaces
- **Component imports**: Group by functionality (UI, analysis, data)

## Testing Organization
- **Unit tests**: Co-located in `__tests__/` directories
- **Test files**: `.test.ts` or `.test.tsx` extensions
- **Test utilities**: Shared test helpers in `src/lib/test-utils/`
- **Coverage**: Focus on business logic in `lib/` directories