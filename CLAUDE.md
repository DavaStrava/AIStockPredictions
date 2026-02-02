# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/claude-code) when working with code in this repository.

## Project Overview

AI Stock Prediction Platform - A Next.js web application that combines technical analysis, modern portfolio theory, and market sentiment analysis to provide AI-powered investment insights.

## Tech Stack

- **Frontend**: Next.js 15 with React 19, App Router, Server Components
- **Styling**: Tailwind CSS v4 with dark mode support
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL (Render managed database in production)
- **Deployment**: Render (web service + managed PostgreSQL)
- **Testing**: Vitest
- **Analysis**: technicalindicators, simple-statistics, Recharts

## Common Commands

```bash
# Development
npm run dev              # Start dev server with Turbopack
npm run build            # Production build
npm run lint             # Run ESLint

# Testing
npm run test             # Run tests in watch mode
npm run test:run         # Run tests once
npm run test:ui          # Open Vitest UI

# Database
npm run db:setup         # Initialize database and run migrations
npm run db:migrate       # Run pending migrations
npm run db:seed          # Seed development data
npm run db:health        # Check database connectivity

# Deployment
# Render auto-deploys from main branch
# Configure via render.yaml or Render dashboard
```

## Project Structure

- `src/` - Main application source code (Next.js App Router)
- `.kiro/` - Project specifications and steering docs

## Key Conventions

- TypeScript strict mode is enabled with path aliases (@/*)
- Use Server Components by default, Client Components only when needed
- Tailwind CSS for all styling
- Vitest for testing with @testing-library/react
