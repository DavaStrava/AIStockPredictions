/**
 * Database Connection Module - PostgreSQL Connection Management
 * 
 * Provides production-ready database connectivity with:
 * - Connection pooling for performance
 * - DATABASE_URL support for Supabase/cloud deployments
 * - AWS Secrets Manager integration for secure credentials
 * - Transaction support with automatic rollback
 * - Health check capabilities for monitoring
 */

import { Pool, PoolClient, PoolConfig } from 'pg';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

/**
 * Database credentials structure matching AWS Secrets Manager format.
 */
interface DatabaseCredentials {
  username: string;
  password: string;
  host: string;
  port: number;
  dbname: string;
}

/**
 * Configuration options for database connections.
 */
interface ConnectionConfig {
  /** Full connection string (e.g., from Supabase DATABASE_URL) */
  connectionString?: string;
  /** AWS Secrets Manager ARN for production deployments */
  secretArn?: string;
  /** Database host (for local development) */
  host?: string;
  /** Database port (default: 5432) */
  port?: number;
  /** Database name */
  database?: string;
  /** Database username */
  username?: string;
  /** Database password */
  password?: string;
  /** Enable SSL/TLS encryption (default: true for non-localhost) */
  ssl?: boolean;
  /**
   * Verify SSL certificates (default: true in production, false for cloud providers like Supabase).
   * Set DB_SSL_REJECT_UNAUTHORIZED=false for cloud providers that use self-signed certificates.
   */
  sslRejectUnauthorized?: boolean;
  /** Maximum concurrent connections (default: 10) */
  maxConnections?: number;
  /** Idle connection timeout in ms (default: 30000) */
  idleTimeoutMs?: number;
  /** Connection establishment timeout in ms (default: 10000) */
  connectionTimeoutMs?: number;
}

/**
 * Production-ready database connection manager with connection pooling,
 * AWS Secrets Manager integration, and transaction support.
 */
class DatabaseConnection {
  private pool: Pool | null = null;
  private config: ConnectionConfig;
  private secretsClient: SecretsManagerClient;

  /**
   * Creates a new DatabaseConnection instance.
   * @param config - Optional configuration overrides
   */
  constructor(config: ConnectionConfig = {}) {
    // Auto-detect local development: disable SSL for localhost connections
    const isLocalhost = (config.host || process.env.DB_HOST || 'localhost') === 'localhost';
    const defaultSsl = config.ssl !== undefined ? config.ssl : !isLocalhost;

    // SSL certificate verification:
    // - Default to true (secure) in production
    // - Can be disabled via env var for cloud providers with self-signed certs (e.g., Supabase)
    // - Explicitly check for 'false' string since env vars are strings
    const envSslRejectUnauthorized = process.env.DB_SSL_REJECT_UNAUTHORIZED;
    const defaultSslRejectUnauthorized = envSslRejectUnauthorized !== undefined
      ? envSslRejectUnauthorized !== 'false'
      : true; // Default to secure (verify certificates)

    this.config = {
      maxConnections: 10,
      idleTimeoutMs: 30000,
      connectionTimeoutMs: 10000,
      ssl: defaultSsl,
      sslRejectUnauthorized: config.sslRejectUnauthorized ?? defaultSslRejectUnauthorized,
      ...config,
    };

    this.secretsClient = new SecretsManagerClient({
      region: process.env.AWS_REGION || 'us-west-2',
    });
  }

  /**
   * Retrieves database credentials from AWS Secrets Manager.
   * @returns Database credentials
   * @throws Error if Secret ARN is missing or retrieval fails
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
   * Initializes the connection pool with configured settings.
   * Supports DATABASE_URL for cloud deployments (Supabase, Railway, etc.)
   * @returns Configured PostgreSQL connection pool
   */
  private async initializePool(): Promise<Pool> {
    // Check for DATABASE_URL first (Supabase/cloud deployment)
    const connectionString = this.config.connectionString || process.env.DATABASE_URL;
    
    let poolConfig: PoolConfig;

    // Build SSL configuration based on settings
    // rejectUnauthorized: true (default) validates server certificates for MITM protection
    // Set DB_SSL_REJECT_UNAUTHORIZED=false for cloud providers with self-signed certs
    const sslConfig = this.config.ssl
      ? { rejectUnauthorized: this.config.sslRejectUnauthorized ?? true }
      : false;

    if (connectionString) {
      // Use connection string for cloud deployments
      poolConfig = {
        connectionString,
        max: this.config.maxConnections,
        idleTimeoutMillis: this.config.idleTimeoutMs,
        connectionTimeoutMillis: this.config.connectionTimeoutMs,
        ssl: sslConfig,
      };
    } else if (this.config.secretArn) {
      // Use AWS Secrets Manager
      const credentials = await this.getCredentialsFromSecret();
      poolConfig = {
        user: credentials.username,
        password: credentials.password,
        host: credentials.host,
        port: credentials.port,
        database: credentials.dbname,
        max: this.config.maxConnections,
        idleTimeoutMillis: this.config.idleTimeoutMs,
        connectionTimeoutMillis: this.config.connectionTimeoutMs,
        ssl: sslConfig,
      };
    } else {
      // Use individual credentials for local development
      const credentials = {
        username: this.config.username || process.env.DB_USER || 'postgres',
        password: this.config.password || process.env.DB_PASSWORD || '',
        host: this.config.host || process.env.DB_HOST || 'localhost',
        port: this.config.port || parseInt(process.env.DB_PORT || '5432'),
        dbname: this.config.database || process.env.DB_NAME || 'ai_stock_prediction',
      };

      poolConfig = {
        user: credentials.username,
        password: credentials.password,
        host: credentials.host,
        port: credentials.port,
        database: credentials.dbname,
        max: this.config.maxConnections,
        idleTimeoutMillis: this.config.idleTimeoutMs,
        connectionTimeoutMillis: this.config.connectionTimeoutMs,
        ssl: sslConfig,
      };
    }

    const pool = new Pool(poolConfig);

    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });

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
   * Gets the connection pool instance, initializing it if necessary.
   * Uses lazy initialization for optimal serverless performance.
   * @returns The singleton connection pool instance
   */
  async getPool(): Promise<Pool> {
    if (!this.pool) {
      this.pool = await this.initializePool();
    }
    return this.pool;
  }

  /**
   * Acquires a client from the connection pool.
   * Remember to call client.release() when done.
   * @returns A database client from the pool
   * 
   * @example
   * ```typescript
   * const client = await db.getClient();
   * try {
   *   const result = await client.query('SELECT * FROM users');
   * } finally {
   *   client.release();
   * }
   * ```
   */
  async getClient(): Promise<PoolClient> {
    const pool = await this.getPool();
    return pool.connect();
  }

  /**
   * Executes a SQL query with automatic connection management.
   * @param text - SQL query string (use $1, $2, etc. for parameters)
   * @param params - Optional array of query parameters
   * @returns Query result object
   * 
   * @example
   * ```typescript
   * const result = await db.query(
   *   'SELECT * FROM users WHERE email = $1',
   *   ['user@example.com']
   * );
   * ```
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
   * Executes multiple operations within a database transaction.
   * Automatically commits on success or rolls back on failure.
   * @param callback - Function containing transaction operations
   * @returns The result returned by the callback
   * 
   * @example
   * ```typescript
   * const result = await db.transaction(async (client) => {
   *   await client.query('UPDATE accounts SET balance = balance - $1 WHERE id = $2', [100, fromId]);
   *   await client.query('UPDATE accounts SET balance = balance + $1 WHERE id = $2', [100, toId]);
   *   return { success: true };
   * });
   * ```
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
   * Closes all connections in the pool.
   * Call this during application shutdown.
   */
  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      console.log('Database connection pool closed');
    }
  }

  /**
   * Checks database connectivity.
   * @returns true if database is healthy, false otherwise
   * 
   * @example
   * ```typescript
   * app.get('/health', async (req, res) => {
   *   const isHealthy = await db.healthCheck();
   *   res.status(isHealthy ? 200 : 503).json({ status: isHealthy ? 'healthy' : 'unhealthy' });
   * });
   * ```
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

// Singleton instance for connection reuse across Lambda invocations
let dbInstance: DatabaseConnection | null = null;

/**
 * Gets the singleton database connection instance.
 * @param config - Optional configuration (only used on first call)
 * @returns The singleton database connection instance
 */
export function getDatabase(config?: ConnectionConfig): DatabaseConnection {
  if (!dbInstance) {
    dbInstance = new DatabaseConnection(config);
  }
  return dbInstance;
}

/**
 * Initializes database connection using AWS Secrets Manager.
 * Recommended for production deployments.
 * @param secretArn - AWS Secrets Manager ARN containing database credentials
 * @returns Configured database connection
 */
export function initializeDatabaseFromSecret(secretArn: string): DatabaseConnection {
  return getDatabase({ secretArn });
}

/**
 * Initializes database connection for local development.
 * SSL is disabled by default for local databases.
 * @param config - Direct database configuration
 * @returns Configured database connection
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
    ssl: false,
  });
}

export { DatabaseConnection };
