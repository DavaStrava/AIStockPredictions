import { DatabaseConnection } from '../connection';

interface SeedData {
  users: Array<{
    email: string;
  }>;
  watchlists: Array<{
    user_email: string;
    name: string;
    description: string;
    stocks: string[];
  }>;
  market_data: Array<{
    symbol: string;
    date: string;
    open_price: number;
    high_price: number;
    low_price: number;
    close_price: number;
    volume: number;
    adjusted_close: number;
  }>;
  predictions: Array<{
    symbol: string;
    prediction_date: string;
    target_price: number;
    confidence_score: number;
    time_horizon: string;
    technical_signals: any;
    portfolio_metrics: any;
    sentiment_data: any;
  }>;
  insights: Array<{
    symbol: string;
    insight_type: string;
    content: string;
    llm_provider: string;
    confidence_score: number;
    metadata: any;
  }>;
}

const SEED_DATA: SeedData = {
  users: [
    { email: 'demo@example.com' },
    { email: 'investor@example.com' },
    { email: 'trader@example.com' },
  ],
  
  watchlists: [
    {
      user_email: 'demo@example.com',
      name: 'Tech Stocks',
      description: 'Major technology companies',
      stocks: ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA'],
    },
    {
      user_email: 'demo@example.com',
      name: 'Blue Chips',
      description: 'Large cap dividend stocks',
      stocks: ['JNJ', 'PG', 'KO', 'PEP', 'WMT'],
    },
    {
      user_email: 'investor@example.com',
      name: 'Growth Portfolio',
      description: 'High growth potential stocks',
      stocks: ['NVDA', 'AMD', 'CRM', 'NFLX', 'SHOP'],
    },
  ],
  
  market_data: [
    // AAPL sample data
    {
      symbol: 'AAPL',
      date: '2024-01-15',
      open_price: 185.50,
      high_price: 188.20,
      low_price: 184.30,
      close_price: 187.45,
      volume: 45678900,
      adjusted_close: 187.45,
    },
    {
      symbol: 'AAPL',
      date: '2024-01-16',
      open_price: 187.80,
      high_price: 190.15,
      low_price: 186.90,
      close_price: 189.25,
      volume: 52341200,
      adjusted_close: 189.25,
    },
    // GOOGL sample data
    {
      symbol: 'GOOGL',
      date: '2024-01-15',
      open_price: 142.30,
      high_price: 144.80,
      low_price: 141.50,
      close_price: 143.95,
      volume: 28456700,
      adjusted_close: 143.95,
    },
    {
      symbol: 'GOOGL',
      date: '2024-01-16',
      open_price: 144.20,
      high_price: 146.75,
      low_price: 143.80,
      close_price: 145.60,
      volume: 31234500,
      adjusted_close: 145.60,
    },
    // MSFT sample data
    {
      symbol: 'MSFT',
      date: '2024-01-15',
      open_price: 375.20,
      high_price: 378.90,
      low_price: 374.10,
      close_price: 377.55,
      volume: 19876500,
      adjusted_close: 377.55,
    },
  ],
  
  predictions: [
    {
      symbol: 'AAPL',
      prediction_date: '2024-01-17',
      target_price: 195.00,
      confidence_score: 0.78,
      time_horizon: '1w',
      technical_signals: {
        rsi: 65.4,
        macd: {
          macd: 2.34,
          signalLine: 1.89,
          histogram: 0.45,
        },
        bollingerBands: {
          upper: 192.50,
          middle: 187.25,
          lower: 182.00,
        },
        movingAverages: {
          sma20: 185.30,
          sma50: 182.75,
          sma200: 175.40,
          ema12: 186.80,
          ema26: 184.20,
        },
      },
      portfolio_metrics: {
        beta: 1.24,
        alpha: 0.08,
        sharpeRatio: 1.45,
        sortinoRatio: 1.78,
        correlation: {
          'SPY': 0.85,
          'QQQ': 0.92,
          'GOOGL': 0.67,
        },
        volatility: 0.28,
        expectedReturn: 0.12,
      },
      sentiment_data: {
        newsScore: 0.65,
        socialScore: 0.72,
        analystRating: 0.80,
        institutionalFlow: 0.58,
        aggregatedScore: 0.69,
        confidence: 0.85,
      },
    },
    {
      symbol: 'GOOGL',
      prediction_date: '2024-01-17',
      target_price: 152.00,
      confidence_score: 0.82,
      time_horizon: '1m',
      technical_signals: {
        rsi: 58.2,
        macd: {
          macd: 1.87,
          signalLine: 1.45,
          histogram: 0.42,
        },
        bollingerBands: {
          upper: 148.75,
          middle: 144.20,
          lower: 139.65,
        },
        movingAverages: {
          sma20: 143.80,
          sma50: 141.25,
          sma200: 138.90,
          ema12: 144.50,
          ema26: 142.10,
        },
      },
      portfolio_metrics: {
        beta: 1.15,
        alpha: 0.06,
        sharpeRatio: 1.32,
        sortinoRatio: 1.65,
        correlation: {
          'SPY': 0.78,
          'QQQ': 0.88,
          'AAPL': 0.67,
        },
        volatility: 0.32,
        expectedReturn: 0.14,
      },
      sentiment_data: {
        newsScore: 0.58,
        socialScore: 0.63,
        analystRating: 0.75,
        institutionalFlow: 0.52,
        aggregatedScore: 0.62,
        confidence: 0.78,
      },
    },
  ],
  
  insights: [
    {
      symbol: 'AAPL',
      insight_type: 'technical',
      content: 'Apple (AAPL) is showing strong bullish momentum with RSI at 65.4, indicating the stock is approaching overbought territory but still has room to run. The MACD histogram is positive at 0.45, suggesting continued upward momentum. The stock is trading above all major moving averages, with the 20-day SMA providing strong support at $185.30. Bollinger Bands are expanding, indicating increased volatility and potential for a breakout above the upper band at $192.50.',
      llm_provider: 'openai',
      confidence_score: 0.85,
      metadata: {
        indicators_used: ['RSI', 'MACD', 'Bollinger Bands', 'Moving Averages'],
        timeframe: '1D',
        data_quality: 'high',
        market_conditions: 'bullish',
      },
    },
    {
      symbol: 'AAPL',
      insight_type: 'portfolio',
      content: 'From a portfolio perspective, Apple exhibits a beta of 1.24, making it more volatile than the broader market. The positive alpha of 0.08 indicates the stock has been outperforming its expected return based on its beta. With a Sharpe ratio of 1.45 and Sortino ratio of 1.78, Apple demonstrates strong risk-adjusted returns. The high correlation with QQQ (0.92) suggests it moves closely with the tech-heavy NASDAQ, while its moderate correlation with SPY (0.85) indicates some diversification benefits.',
      llm_provider: 'openai',
      confidence_score: 0.78,
      metadata: {
        metrics_used: ['Beta', 'Alpha', 'Sharpe Ratio', 'Sortino Ratio', 'Correlation'],
        benchmark: 'SPY',
        risk_level: 'moderate',
      },
    },
    {
      symbol: 'AAPL',
      insight_type: 'sentiment',
      content: 'Market sentiment for Apple is moderately positive with an aggregated score of 0.69. Analyst ratings are particularly strong at 0.80, reflecting continued confidence from professional analysts. Social media sentiment at 0.72 shows retail investor enthusiasm, while news sentiment at 0.65 indicates generally positive media coverage. Institutional flow at 0.58 suggests some caution from large investors, possibly due to valuation concerns. Overall sentiment confidence is high at 0.85, indicating reliable data quality.',
      llm_provider: 'bedrock',
      confidence_score: 0.82,
      metadata: {
        sentiment_sources: ['news', 'social', 'analyst', 'institutional'],
        data_freshness: '1 hour',
        sample_size: 'large',
      },
    },
    {
      symbol: 'GOOGL',
      insight_type: 'technical',
      content: 'Google (GOOGL) displays healthy technical indicators with RSI at 58.2, positioned in the neutral zone with room for upward movement. The MACD is bullish with the histogram at 0.42, indicating strengthening momentum. The stock is trading above all key moving averages, suggesting a strong uptrend. Bollinger Bands show the stock is in the middle of its trading range, with potential to test the upper band at $148.75. Volume patterns support the current price action.',
      llm_provider: 'openai',
      confidence_score: 0.79,
      metadata: {
        indicators_used: ['RSI', 'MACD', 'Bollinger Bands', 'Moving Averages', 'Volume'],
        timeframe: '1D',
        trend: 'bullish',
      },
    },
  ],
};

export class DatabaseSeeder {
  private db: DatabaseConnection;

  constructor(db: DatabaseConnection) {
    this.db = db;
  }

  /**
   * Clear all existing data (for development only)
   */
  async clearData(): Promise<void> {
    console.log('Clearing existing seed data...');
    
    const tables = [
      'insights',
      'backtest_results', 
      'predictions',
      'market_data',
      'watchlist_stocks',
      'watchlists',
      'users',
    ];

    for (const table of tables) {
      await this.db.query(`DELETE FROM ${table}`);
    }
    
    console.log('Existing data cleared');
  }

  /**
   * Seed users table
   */
  private async seedUsers(): Promise<Map<string, string>> {
    console.log('Seeding users...');
    const userIdMap = new Map<string, string>();
    
    for (const user of SEED_DATA.users) {
      const result = await this.db.query(
        'INSERT INTO users (email) VALUES ($1) RETURNING id',
        [user.email]
      );
      userIdMap.set(user.email, result.rows[0].id);
    }
    
    console.log(`Seeded ${SEED_DATA.users.length} users`);
    return userIdMap;
  }

  /**
   * Seed watchlists and watchlist_stocks tables
   */
  private async seedWatchlists(userIdMap: Map<string, string>): Promise<void> {
    console.log('Seeding watchlists...');
    
    for (const watchlist of SEED_DATA.watchlists) {
      const userId = userIdMap.get(watchlist.user_email);
      if (!userId) {
        console.warn(`User not found for email: ${watchlist.user_email}`);
        continue;
      }
      
      // Insert watchlist
      const watchlistResult = await this.db.query(
        'INSERT INTO watchlists (user_id, name, description) VALUES ($1, $2, $3) RETURNING id',
        [userId, watchlist.name, watchlist.description]
      );
      
      const watchlistId = watchlistResult.rows[0].id;
      
      // Insert stocks for this watchlist
      for (const symbol of watchlist.stocks) {
        await this.db.query(
          'INSERT INTO watchlist_stocks (watchlist_id, symbol) VALUES ($1, $2)',
          [watchlistId, symbol]
        );
      }
    }
    
    console.log(`Seeded ${SEED_DATA.watchlists.length} watchlists`);
  }

  /**
   * Seed market_data table
   */
  private async seedMarketData(): Promise<void> {
    console.log('Seeding market data...');
    
    for (const data of SEED_DATA.market_data) {
      await this.db.query(`
        INSERT INTO market_data (
          symbol, date, open_price, high_price, low_price, 
          close_price, volume, adjusted_close
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        data.symbol,
        data.date,
        data.open_price,
        data.high_price,
        data.low_price,
        data.close_price,
        data.volume,
        data.adjusted_close,
      ]);
    }
    
    console.log(`Seeded ${SEED_DATA.market_data.length} market data records`);
  }

  /**
   * Seed predictions table
   */
  private async seedPredictions(): Promise<void> {
    console.log('Seeding predictions...');
    
    for (const prediction of SEED_DATA.predictions) {
      await this.db.query(`
        INSERT INTO predictions (
          symbol, prediction_date, target_price, confidence_score,
          time_horizon, technical_signals, portfolio_metrics, sentiment_data
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        prediction.symbol,
        prediction.prediction_date,
        prediction.target_price,
        prediction.confidence_score,
        prediction.time_horizon,
        JSON.stringify(prediction.technical_signals),
        JSON.stringify(prediction.portfolio_metrics),
        JSON.stringify(prediction.sentiment_data),
      ]);
    }
    
    console.log(`Seeded ${SEED_DATA.predictions.length} predictions`);
  }

  /**
   * Seed insights table
   */
  private async seedInsights(): Promise<void> {
    console.log('Seeding insights...');
    
    for (const insight of SEED_DATA.insights) {
      await this.db.query(`
        INSERT INTO insights (
          symbol, insight_type, content, llm_provider,
          confidence_score, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        insight.symbol,
        insight.insight_type,
        insight.content,
        insight.llm_provider,
        insight.confidence_score,
        JSON.stringify(insight.metadata),
      ]);
    }
    
    console.log(`Seeded ${SEED_DATA.insights.length} insights`);
  }

  /**
   * Run all seed operations
   */
  async seed(clearExisting: boolean = true): Promise<void> {
    console.log('Starting database seeding...');
    
    try {
      if (clearExisting) {
        await this.clearData();
      }
      
      const userIdMap = await this.seedUsers();
      await this.seedWatchlists(userIdMap);
      await this.seedMarketData();
      await this.seedPredictions();
      await this.seedInsights();
      
      console.log('Database seeding completed successfully!');
      
    } catch (error) {
      console.error('Database seeding failed:', error);
      throw error;
    }
  }
}

/**
 * Convenience function to seed the database
 */
export async function seedDatabase(db: DatabaseConnection, clearExisting: boolean = true): Promise<void> {
  const seeder = new DatabaseSeeder(db);
  await seeder.seed(clearExisting);
}