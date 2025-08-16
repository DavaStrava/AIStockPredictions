import { Pool, PoolClient, PoolConfig } from 'pg';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

interface DatabaseCredentials {
  username: string;
  password: string;
  host: string;
  port: number;
  dbname: string;
}

interface ConnectionConfig {
  secretArn?: string;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  ssl?: boolean;
  maxConnections?: number;
  idleTimeoutMs?: number;
  connectionTimeoutMs?: number;
}

class DatabaseConnection {
  private pool: Pool | null = null;
  private config: ConnectionConfig;
  private secretsClient: SecretsManagerClient;

  constructor(config: ConnectionConfig = {}) {
    this.config = {
      maxConnections: 10,
      idleTimeoutMs: 30000,
      connectionTimeoutMs: 10000,
      ssl: true,
      ...config,
    };
    
    this.secretsClient = new SecretsManagerClient({
      region: process.env.AWS_REGION || 'us-west-2',
    });
  }

  /**
   * Get database credentials from AWS Secrets Manager
   */
  private async getCredentialsFromSecret(): Promise<DatabaseCredentials> {
    if (!this.config.secretArn) {
      throw new Error('Secret ARN is required when using Secrets Manager');
    }

    try {
      const command = new GetSecretValueCommand({
        SecretId: this.config.secretArn,
      });
      
      const response = await this.secretsClient.send(command);
      
      if (!response.SecretString) {
        throw new Error('Secret value is empty');
      }

      const secret = JSON.parse(response.SecretString);
      
      return {
        username: secret.username,
        password: secret.password,
        host: secret.host || this.config.host || 'localhost',
        port: secret.port || this.config.port || 5432,
        dbname: secret.dbname || this.config.database || 'ai_stock_prediction',
      };
    } catch (error) {
      console.error('Failed to retrieve database credentials:', error);
      throw new Error('Failed to retrieve database credentials from Secrets Manager');
    }
  }

  /**
   * Initialize the connection pool
   */
  private async initializePool(): Promise<Pool> {
    let credentials: DatabaseCredentials;

    if (this.config.secretArn) {
      credentials = await this.getCredentialsFromSecret();
    } else {
      // Use environment variables for local development
      credentials = {
        username: this.config.username || process.env.DB_USER || 'postgres',
        password: this.config.password || process.env.DB_PASSWORD || '',
        host: this.config.host || process.env.DB_HOST || 'localhost',
        port: this.config.port || parseInt(process.env.DB_PORT || '5432'),
        dbname: this.config.database || process.env.DB_NAME || 'ai_stock_prediction',
      };
    }

    const poolConfig: PoolConfig = {
      user: credentials.username,
      password: credentials.password,
      host: credentials.host,
      port: credentials.port,
      database: credentials.dbname,
      max: this.config.maxConnections,
      idleTimeoutMillis: this.config.idleTimeoutMs,
      connectionTimeoutMillis: this.config.connectionTimeoutMs,
      ssl: this.config.ssl ? { rejectUnauthorized: false } : false,
    };

    const pool = new Pool(poolConfig);

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });

    // Test the connection
    try {
      const client = await pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      console.log('Database connection pool initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database connection:', error);
      throw error;
    }

    return pool;
  }

  /**
   * Get a connection pool instance
   */
  async getPool(): Promise<Pool> {
    if (!this.pool) {
      this.pool = await this.initializePool();
    }
    return this.pool;
  }

  /**
   * Get a client from the pool
   */
  async getClient(): Promise<PoolClient> {
    const pool = await this.getPool();
    return pool.connect();
  }

  /**
   * Execute a query with automatic client management
   */
  async query(text: string, params?: any[]): Promise<any> {
    const pool = await this.getPool();
    try {
      const result = await pool.query(text, params);
      return result;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  /**
   * Execute a transaction
   */
  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getClient();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Close the connection pool
   */
  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      console.log('Database connection pool closed');
    }
  }

  /**
   * Check if the database is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.query('SELECT 1 as health_check');
      return result.rows.length > 0 && result.rows[0].health_check === 1;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }
}

// Singleton instance for Lambda functions
let dbInstance: DatabaseConnection | null = null;

/**
 * Get database connection instance (singleton pattern for Lambda)
 */
export function getDatabase(config?: ConnectionConfig): DatabaseConnection {
  if (!dbInstance) {
    dbInstance = new DatabaseConnection(config);
  }
  return dbInstance;
}

/**
 * Initialize database connection with AWS Secrets Manager
 */
export function initializeDatabaseFromSecret(secretArn: string): DatabaseConnection {
  return getDatabase({ secretArn });
}

/**
 * Initialize database connection with direct credentials (for local development)
 */
export function initializeDatabaseLocal(config: {
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
}): DatabaseConnection {
  return getDatabase({
    ...config,
    ssl: false, // Disable SSL for local development
  });
}

export { DatabaseConnection };