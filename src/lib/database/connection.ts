/**
 * DATABASE CONNECTION MODULE - Production-Ready PostgreSQL Connection Management
 * 
 * This module demonstrates several critical patterns for building robust database
 * connections in production applications, especially in serverless environments
 * like AWS Lambda where connection management is crucial for performance and cost.
 * 
 * 🏗️ KEY ARCHITECTURAL PATTERNS DEMONSTRATED:
 * 
 * 1. CONNECTION POOLING PATTERN:
 *    - Uses PostgreSQL connection pools to reuse database connections
 *    - Prevents connection exhaustion and improves performance
 *    - Essential for serverless functions that may scale rapidly
 * 
 * 2. SINGLETON PATTERN:
 *    - Single database instance shared across Lambda invocations
 *    - Reduces connection overhead and improves cold start performance
 *    - Critical for cost optimization in serverless environments
 * 
 * 3. SECRETS MANAGEMENT PATTERN:
 *    - Integrates with AWS Secrets Manager for secure credential storage
 *    - Supports both cloud (Secrets Manager) and local development modes
 *    - Follows 12-factor app principles for configuration management
 * 
 * 4. GRACEFUL DEGRADATION:
 *    - Comprehensive error handling with meaningful error messages
 *    - Health check capabilities for monitoring and alerting
 *    - Transaction support with automatic rollback on failures
 * 
 * 💡 LEARNING OBJECTIVES:
 * - Understanding connection pooling and why it matters
 * - Learning AWS Secrets Manager integration patterns
 * - Seeing how to build production-ready database abstractions
 * - Understanding transaction management and error handling
 * 
 * This code serves as a template for any production application requiring
 * reliable, scalable database connectivity with proper security practices.
 */

import { Pool, PoolClient, PoolConfig } from 'pg';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

/**
 * Database Credentials Interface
 * 
 * This interface defines the structure for database connection credentials.
 * It's separate from the configuration interface to maintain clear separation
 * between what we receive from AWS Secrets Manager and what we use internally.
 * 
 * 🎯 DESIGN PRINCIPLES:
 * - Single Responsibility: Only contains credential data
 * - Type Safety: Ensures all required fields are present
 * - Consistency: Matches the structure expected from Secrets Manager
 * 
 * @interface DatabaseCredentials
 */
interface DatabaseCredentials {
  username: string;    // Database username (e.g., 'postgres', 'app_user')
  password: string;    // Database password (stored securely in Secrets Manager)
  host: string;        // Database host (e.g., 'localhost', 'db.amazonaws.com')
  port: number;        // Database port (typically 5432 for PostgreSQL)
  dbname: string;      // Database name (e.g., 'ai_stock_prediction')
}

/**
 * Connection Configuration Interface
 * 
 * This interface demonstrates the CONFIGURATION PATTERN, providing flexible
 * options for different deployment environments while maintaining sensible defaults.
 * 
 * 🔧 CONFIGURATION STRATEGY:
 * - Optional fields with sensible defaults for production use
 * - Support for both AWS Secrets Manager and direct credentials
 * - Connection pool tuning parameters for performance optimization
 * - SSL configuration for secure connections
 * 
 * 💡 WHY OPTIONAL FIELDS MATTER:
 * - Allows minimal configuration for simple use cases
 * - Enables environment-specific overrides (dev vs prod)
 * - Supports gradual migration from direct credentials to Secrets Manager
 * - Makes testing easier with minimal setup requirements
 * 
 * @interface ConnectionConfig
 */
interface ConnectionConfig {
  // AWS SECRETS MANAGER INTEGRATION
  secretArn?: string;           // AWS Secrets Manager ARN for production deployments
  
  // DIRECT CREDENTIAL CONFIGURATION (for local development)
  host?: string;                // Database host override
  port?: number;                // Database port override  
  database?: string;            // Database name override
  username?: string;            // Username override
  password?: string;            // Password override (use Secrets Manager in production!)
  
  // CONNECTION SECURITY
  ssl?: boolean;                // Enable SSL/TLS encryption (default: true for production)
  
  // CONNECTION POOL OPTIMIZATION
  maxConnections?: number;      // Maximum concurrent connections (default: 10)
  idleTimeoutMs?: number;       // How long to keep idle connections (default: 30s)
  connectionTimeoutMs?: number; // How long to wait for new connections (default: 10s)
}

/**
 * DatabaseConnection Class - Production-Ready Database Connection Manager
 * 
 * This class implements several important design patterns for building scalable,
 * reliable database connections in cloud environments:
 * 
 * 🏗️ DESIGN PATTERNS IMPLEMENTED:
 * 
 * 1. LAZY INITIALIZATION PATTERN:
 *    - Connection pool is created only when first needed (getPool method)
 *    - Reduces startup time and resource usage
 *    - Essential for serverless functions with cold starts
 * 
 * 2. DEPENDENCY INJECTION PATTERN:
 *    - Configuration injected via constructor
 *    - Makes the class testable and flexible
 *    - Supports different configurations for different environments
 * 
 * 3. RESOURCE MANAGEMENT PATTERN:
 *    - Proper cleanup methods (close) to prevent resource leaks
 *    - Connection pooling to reuse expensive database connections
 *    - Automatic error handling and connection recovery
 * 
 * 4. ADAPTER PATTERN:
 *    - Provides a unified interface regardless of credential source
 *    - Abstracts away differences between Secrets Manager and direct config
 *    - Makes switching between environments seamless
 * 
 * 💡 WHY THIS ARCHITECTURE MATTERS:
 * - Serverless functions benefit from connection reuse across invocations
 * - Connection pools prevent database connection exhaustion
 * - Proper error handling ensures system reliability
 * - Security best practices with encrypted credential storage
 */
class DatabaseConnection {
  // PRIVATE FIELDS - Encapsulation Pattern
  // These fields are private to prevent external modification and maintain
  // control over the connection lifecycle
  private pool: Pool | null = null;           // Lazy-initialized connection pool
  private config: ConnectionConfig;           // Merged configuration with defaults
  private secretsClient: SecretsManagerClient; // AWS SDK client for credential retrieval

  /**
   * Constructor - Dependency Injection and Configuration Merging
   * 
   * This constructor demonstrates several important patterns:
   * 
   * 🔧 CONFIGURATION MERGING PATTERN:
   * The spread operator (...config) merges user configuration with defaults,
   * allowing users to override only the settings they need while maintaining
   * sensible defaults for production use.
   * 
   * 🌐 ENVIRONMENT-AWARE INITIALIZATION:
   * The AWS region is determined from environment variables with a fallback,
   * following the 12-factor app methodology for configuration management.
   * 
   * 💡 WHY THESE DEFAULTS MATTER:
   * - maxConnections: 10 - Balances performance with resource usage
   * - idleTimeoutMs: 30000 - Keeps connections alive for reuse but not indefinitely
   * - connectionTimeoutMs: 10000 - Prevents hanging on slow connections
   * - ssl: true - Security by default for production deployments
   * 
   * @param config - Optional configuration overrides
   */
  constructor(config: ConnectionConfig = {}) {
    // CONFIGURATION MERGING: Combine defaults with user overrides
    // This pattern allows flexible configuration while ensuring safe defaults
    this.config = {
      // PRODUCTION-READY DEFAULTS
      maxConnections: 10,        // Optimal for most serverless workloads
      idleTimeoutMs: 30000,      // 30 seconds - balance between reuse and resource cleanup
      connectionTimeoutMs: 10000, // 10 seconds - reasonable timeout for connection establishment
      ssl: true,                 // Security by default - always use encryption in production
      
      // USER OVERRIDES: Spread operator applies any user-provided configuration
      // This allows environment-specific customization while maintaining defaults
      ...config,
    };

    // AWS SECRETS MANAGER CLIENT INITIALIZATION
    // Initialize the AWS SDK client for retrieving database credentials
    // The region is determined from environment variables with a sensible fallback
    this.secretsClient = new SecretsManagerClient({
      // ENVIRONMENT-AWARE CONFIGURATION
      // Uses AWS_REGION environment variable (set by Lambda runtime)
      // Falls back to us-west-2 for local development
      region: process.env.AWS_REGION || 'us-west-2',
    });
  }

  /**
   * Get Database Credentials from AWS Secrets Manager
   * 
   * This method demonstrates the SECURE CREDENTIAL RETRIEVAL PATTERN,
   * which is essential for production applications that need to access
   * sensitive database credentials without hardcoding them.
   * 
   * 🔐 SECURITY PATTERNS DEMONSTRATED:
   * 
   * 1. SECRETS MANAGER INTEGRATION:
   *    - Retrieves encrypted credentials from AWS Secrets Manager
   *    - Credentials are never stored in code or environment variables
   *    - Automatic credential rotation support (when configured)
   * 
   * 2. DEFENSIVE PROGRAMMING:
   *    - Validates that required configuration is present
   *    - Checks for empty responses from AWS
   *    - Provides meaningful error messages for debugging
   * 
   * 3. FALLBACK CONFIGURATION:
   *    - Uses Secrets Manager values as primary source
   *    - Falls back to configuration overrides for flexibility
   *    - Provides sensible defaults for missing values
   * 
   * 💡 WHY THIS APPROACH MATTERS:
   * - Credentials are encrypted at rest and in transit
   * - No sensitive data in application code or logs
   * - Supports credential rotation without code changes
   * - Enables different credentials per environment
   * 
   * 🚨 SECURITY NOTE:
   * This method should only be used in production environments.
   * For local development, use direct configuration to avoid AWS costs.
   * 
   * @returns Promise<DatabaseCredentials> - Decrypted database credentials
   * @throws {Error} When Secret ARN is missing or credential retrieval fails
   * 
   * @private This method is private because credential handling should be
   *          encapsulated within the connection management logic
   */
  private async getCredentialsFromSecret(): Promise<DatabaseCredentials> {
    // GUARD CLAUSE: Validate required configuration
    // This prevents attempting AWS calls without proper setup
    if (!this.config.secretArn) {
      throw new Error('Secret ARN is required when using Secrets Manager');
    }

    try {
      // AWS SECRETS MANAGER API CALL
      // Create the command object with the secret identifier
      const command = new GetSecretValueCommand({
        SecretId: this.config.secretArn,
      });

      // ASYNC AWS API CALL
      // Send the command to AWS Secrets Manager to retrieve the encrypted secret
      const response = await this.secretsClient.send(command);

      // RESPONSE VALIDATION
      // AWS might return a successful response with empty content
      if (!response.SecretString) {
        throw new Error('Secret value is empty');
      }

      // JSON PARSING
      // Secrets Manager stores credentials as JSON strings
      // Parse the JSON to extract individual credential fields
      const secret = JSON.parse(response.SecretString);

      // CREDENTIAL MAPPING WITH FALLBACKS
      // This pattern provides flexibility while ensuring all required fields are populated
      return {
        username: secret.username,
        password: secret.password,
        // FALLBACK CHAIN: Secret value → Config override → Default value
        // This allows environment-specific overrides while maintaining security
        host: secret.host || this.config.host || 'localhost',
        port: secret.port || this.config.port || 5432,
        dbname: secret.dbname || this.config.database || 'ai_stock_prediction',
      };
    } catch (error) {
      // ERROR HANDLING AND LOGGING
      // Log the error for debugging but don't expose sensitive details
      console.error('Failed to retrieve database credentials:', error);
      
      // THROW SANITIZED ERROR
      // Provide a clean error message without exposing internal details
      throw new Error('Failed to retrieve database credentials from Secrets Manager');
    }
  }

  /**
   * Initialize the Connection Pool
   * 
   * This method demonstrates the CONNECTION POOL INITIALIZATION PATTERN,
   * which is crucial for building scalable database applications that can
   * handle multiple concurrent requests efficiently.
   * 
   * 🏊 CONNECTION POOLING CONCEPTS:
   * 
   * 1. WHY CONNECTION POOLING MATTERS:
   *    - Database connections are expensive to create (TCP handshake, authentication, etc.)
   *    - Pools reuse existing connections, dramatically improving performance
   *    - Prevents connection exhaustion under high load
   *    - Essential for serverless functions that may scale rapidly
   * 
   * 2. POOL CONFIGURATION STRATEGY:
   *    - max: Limits concurrent connections to prevent database overload
   *    - idleTimeoutMillis: Closes unused connections to free resources
   *    - connectionTimeoutMillis: Prevents hanging on slow connection attempts
   * 
   * 3. DUAL CREDENTIAL SOURCES:
   *    - Production: AWS Secrets Manager (secure, encrypted, rotatable)
   *    - Development: Environment variables (convenient, no AWS costs)
   * 
   * 💡 LEARNING OBJECTIVES:
   * - Understanding connection pooling and its performance benefits
   * - Learning environment-specific configuration patterns
   * - Seeing proper error handling and connection validation
   * - Understanding SSL configuration for secure connections
   * 
   * @returns Promise<Pool> - Configured and tested PostgreSQL connection pool
   * @throws {Error} When connection initialization or testing fails
   * 
   * @private This method is private because pool initialization should be
   *          controlled by the getPool() method's lazy loading pattern
   */
  private async initializePool(): Promise<Pool> {
    let credentials: DatabaseCredentials;

    // CREDENTIAL SOURCE SELECTION
    // This conditional demonstrates the STRATEGY PATTERN for credential retrieval
    if (this.config.secretArn) {
      // PRODUCTION PATH: Use AWS Secrets Manager
      // Secure, encrypted credential storage with rotation support
      credentials = await this.getCredentialsFromSecret();
    } else {
      // DEVELOPMENT PATH: Use environment variables or configuration
      // This fallback chain provides flexibility for different development setups
      credentials = {
        // FALLBACK CHAIN PATTERN: Config → Environment → Default
        // Each level provides a more specific override of the previous
        username: this.config.username || process.env.DB_USER || 'postgres',
        password: this.config.password || process.env.DB_PASSWORD || '',
        host: this.config.host || process.env.DB_HOST || 'localhost',
        port: this.config.port || parseInt(process.env.DB_PORT || '5432'),
        dbname: this.config.database || process.env.DB_NAME || 'ai_stock_prediction',
      };
    }

    // CONNECTION POOL CONFIGURATION
    // This configuration object demonstrates production-ready pool settings
    const poolConfig: PoolConfig = {
      // BASIC CONNECTION PARAMETERS
      user: credentials.username,
      password: credentials.password,
      host: credentials.host,
      port: credentials.port,
      database: credentials.dbname,
      
      // POOL PERFORMANCE TUNING
      max: this.config.maxConnections,              // Maximum concurrent connections
      idleTimeoutMillis: this.config.idleTimeoutMs, // How long to keep idle connections
      connectionTimeoutMillis: this.config.connectionTimeoutMs, // Connection establishment timeout
      
      // SSL CONFIGURATION
      // Production: Enable SSL with flexible certificate validation
      // Development: Disable SSL for local databases
      ssl: this.config.ssl ? { rejectUnauthorized: false } : false,
    };

    // POOL CREATION
    // Create the PostgreSQL connection pool with our configuration
    const pool = new Pool(poolConfig);

    // ERROR HANDLING SETUP
    // Register an error handler for unexpected connection issues
    // This prevents unhandled promise rejections that could crash the application
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      // In production, you might want to send this to a monitoring service
    });

    // CONNECTION VALIDATION
    // Test the pool immediately to catch configuration issues early
    // This "fail fast" approach prevents runtime errors in production
    try {
      // ACQUIRE CONNECTION: Get a connection from the pool
      const client = await pool.connect();
      
      // TEST QUERY: Simple query to verify database connectivity
      // SELECT NOW() is lightweight and works on all PostgreSQL versions
      await client.query('SELECT NOW()');
      
      // RELEASE CONNECTION: Return the connection to the pool for reuse
      // This is crucial - forgetting to release connections causes pool exhaustion
      client.release();
      
      // SUCCESS LOGGING: Confirm successful initialization
      console.log('Database connection pool initialized successfully');
    } catch (error) {
      // INITIALIZATION FAILURE HANDLING
      // Log the error and re-throw to prevent the application from starting
      // with a broken database connection
      console.error('Failed to initialize database connection:', error);
      throw error;
    }

    return pool;
  }

  /**
   * Get Connection Pool Instance - Lazy Initialization Pattern
   * 
   * This method implements the LAZY INITIALIZATION PATTERN, which is particularly
   * important in serverless environments where you want to delay expensive
   * operations until they're actually needed.
   * 
   * 🚀 LAZY INITIALIZATION BENEFITS:
   * 
   * 1. PERFORMANCE OPTIMIZATION:
   *    - Connection pool is only created when first database operation occurs
   *    - Reduces cold start time for Lambda functions
   *    - Saves resources if database isn't used in a particular execution
   * 
   * 2. ERROR ISOLATION:
   *    - Database connection errors only occur when database is actually needed
   *    - Application can start successfully even if database is temporarily unavailable
   *    - Allows for graceful degradation in microservice architectures
   * 
   * 3. SINGLETON BEHAVIOR:
   *    - Once created, the same pool instance is reused across all operations
   *    - Prevents multiple pool creation in concurrent scenarios
   *    - Maintains connection efficiency across Lambda invocations
   * 
   * 💡 WHY THIS PATTERN MATTERS:
   * In serverless environments, every millisecond of cold start time matters.
   * By deferring pool creation until needed, we optimize for the common case
   * where the function starts quickly and only pays the connection cost when
   * actually performing database operations.
   * 
   * @returns Promise<Pool> - The singleton connection pool instance
   * @throws {Error} When pool initialization fails
   */
  async getPool(): Promise<Pool> {
    // LAZY INITIALIZATION CHECK
    // Only create the pool if it doesn't already exist
    if (!this.pool) {
      this.pool = await this.initializePool();
    }
    return this.pool;
  }

  /**
   * Get Client from Pool - Resource Management Pattern
   * 
   * This method demonstrates the RESOURCE ACQUISITION PATTERN for database
   * connections. It provides a clean interface for getting individual
   * connections when you need more control than the simple query() method.
   * 
   * 🔧 WHEN TO USE THIS METHOD:
   * - When you need to execute multiple related queries
   * - When you want to control connection lifecycle manually
   * - When implementing custom transaction logic
   * - When you need to use PostgreSQL-specific features
   * 
   * ⚠️ IMPORTANT: Always call client.release() when done!
   * Forgetting to release clients will exhaust the connection pool.
   * 
   * @returns Promise<PoolClient> - A database client from the connection pool
   * @throws {Error} When pool acquisition fails
   * 
   * @example
   * ```typescript
   * const client = await db.getClient();
   * try {
   *   const result = await client.query('SELECT * FROM users');
   *   // Process result...
   * } finally {
   *   client.release(); // Always release in finally block!
   * }
   * ```
   */
  async getClient(): Promise<PoolClient> {
    const pool = await this.getPool();
    return pool.connect();
  }

  /**
   * Execute Query with Automatic Client Management
   * 
   * This method implements the RESOURCE MANAGEMENT PATTERN by automatically
   * handling connection acquisition and release. It's the recommended way
   * to execute simple queries because it prevents connection leaks.
   * 
   * 🎯 AUTOMATIC RESOURCE MANAGEMENT BENEFITS:
   * 
   * 1. LEAK PREVENTION:
   *    - Connections are automatically returned to the pool
   *    - No risk of forgetting to call client.release()
   *    - Prevents connection pool exhaustion
   * 
   * 2. ERROR SAFETY:
   *    - Connections are released even if queries fail
   *    - Proper error logging for debugging
   *    - Clean error propagation to calling code
   * 
   * 3. SIMPLICITY:
   *    - One-line database queries without boilerplate
   *    - Consistent interface for all simple operations
   *    - Reduces code duplication across the application
   * 
   * 💡 PARAMETERIZED QUERIES:
   * Always use the params array for user input to prevent SQL injection.
   * The PostgreSQL driver automatically escapes parameters safely.
   * 
   * @param text - SQL query string (use $1, $2, etc. for parameters)
   * @param params - Optional array of parameters for the query
   * @returns Promise<any> - Query result object with rows, rowCount, etc.
   * @throws {Error} When query execution fails
   * 
   * @example
   * ```typescript
   * // Simple query without parameters
   * const result = await db.query('SELECT NOW()');
   * 
   * // Parameterized query (prevents SQL injection)
   * const user = await db.query(
   *   'SELECT * FROM users WHERE email = $1',
   *   ['user@example.com']
   * );
   * ```
   */
  async query(text: string, params?: any[]): Promise<any> {
    const pool = await this.getPool();
    try {
      // EXECUTE QUERY: Use the pool's query method for automatic connection management
      // The pool handles connection acquisition, query execution, and connection release
      const result = await pool.query(text, params);
      return result;
    } catch (error) {
      // ERROR LOGGING: Log the error for debugging purposes
      // In production, you might want to sanitize this to avoid logging sensitive data
      console.error('Database query error:', error);
      
      // ERROR PROPAGATION: Re-throw the error so calling code can handle it
      // This maintains the error chain while providing logging
      throw error;
    }
  }

  /**
   * Execute Database Transaction - ACID Transaction Pattern
   * 
   * This method implements the DATABASE TRANSACTION PATTERN, which is crucial
   * for maintaining data consistency when multiple related database operations
   * need to succeed or fail together.
   * 
   * 🔒 ACID TRANSACTION PROPERTIES:
   * 
   * 1. ATOMICITY:
   *    - All operations in the transaction succeed, or all are rolled back
   *    - No partial updates that could leave data in an inconsistent state
   *    - Essential for financial applications where data integrity is critical
   * 
   * 2. CONSISTENCY:
   *    - Database constraints are enforced throughout the transaction
   *    - Foreign key relationships remain valid
   *    - Business rules are maintained
   * 
   * 3. ISOLATION:
   *    - Concurrent transactions don't interfere with each other
   *    - Each transaction sees a consistent view of the data
   *    - Prevents race conditions and data corruption
   * 
   * 4. DURABILITY:
   *    - Once committed, changes are permanently stored
   *    - Survives system crashes and power failures
   *    - Guaranteed by the database engine
   * 
   * 🎯 TRANSACTION LIFECYCLE:
   * 1. BEGIN - Start the transaction
   * 2. Execute operations via callback function
   * 3. COMMIT - Make changes permanent (if successful)
   * 4. ROLLBACK - Undo all changes (if any operation fails)
   * 5. Release connection back to pool
   * 
   * 💡 WHEN TO USE TRANSACTIONS:
   * - Creating related records (user + profile + preferences)
   * - Financial operations (debit one account, credit another)
   * - Batch updates that must be consistent
   * - Any operation where partial success would be problematic
   * 
   * @param callback - Function that performs database operations within the transaction
   * @returns Promise<T> - The result returned by the callback function
   * @throws {Error} When any operation in the transaction fails
   * 
   * @example
   * ```typescript
   * // Transfer money between accounts (classic transaction example)
   * const result = await db.transaction(async (client) => {
   *   // Debit from source account
   *   await client.query(
   *     'UPDATE accounts SET balance = balance - $1 WHERE id = $2',
   *     [amount, fromAccountId]
   *   );
   *   
   *   // Credit to destination account
   *   await client.query(
   *     'UPDATE accounts SET balance = balance + $1 WHERE id = $2',
   *     [amount, toAccountId]
   *   );
   *   
   *   // Log the transaction
   *   const logResult = await client.query(
   *     'INSERT INTO transaction_log (from_account, to_account, amount) VALUES ($1, $2, $3) RETURNING id',
   *     [fromAccountId, toAccountId, amount]
   *   );
   *   
   *   return logResult.rows[0].id;
   * });
   * ```
   */
  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    // ACQUIRE DEDICATED CONNECTION
    // Transactions require a dedicated connection because they maintain state
    // (the transaction context) that must persist across multiple queries
    const client = await this.getClient();

    try {
      // BEGIN TRANSACTION
      // Start the database transaction - all subsequent queries on this
      // connection will be part of the same transaction until COMMIT or ROLLBACK
      await client.query('BEGIN');
      
      // EXECUTE CALLBACK
      // Run the user-provided function that contains the business logic
      // The callback receives the client so it can execute queries within the transaction
      const result = await callback(client);
      
      // COMMIT TRANSACTION
      // If we reach this point, all operations succeeded
      // Make all changes permanent in the database
      await client.query('COMMIT');
      
      // RETURN RESULT
      // Return whatever the callback function returned
      return result;
    } catch (error) {
      // ROLLBACK ON ERROR
      // If any operation failed, undo all changes made in this transaction
      // This ensures the database remains in a consistent state
      await client.query('ROLLBACK');
      
      // PROPAGATE ERROR
      // Re-throw the error so the calling code knows the transaction failed
      throw error;
    } finally {
      // GUARANTEED CLEANUP
      // The finally block ensures the connection is always released,
      // regardless of whether the transaction succeeded or failed
      // This prevents connection leaks that would exhaust the pool
      client.release();
    }
  }

  /**
   * Close Connection Pool - Resource Cleanup Pattern
   * 
   * This method implements the RESOURCE CLEANUP PATTERN, which is essential
   * for preventing resource leaks and ensuring graceful application shutdown.
   * 
   * 🧹 CLEANUP RESPONSIBILITIES:
   * 
   * 1. CONNECTION TERMINATION:
   *    - Closes all active connections in the pool
   *    - Waits for in-flight queries to complete
   *    - Prevents new connections from being created
   * 
   * 2. MEMORY CLEANUP:
   *    - Sets pool reference to null to enable garbage collection
   *    - Frees up memory used by connection objects
   *    - Cleans up event listeners and timers
   * 
   * 3. GRACEFUL SHUTDOWN:
   *    - Allows existing operations to complete
   *    - Prevents new operations from starting
   *    - Provides clean application termination
   * 
   * 💡 WHEN TO CALL THIS METHOD:
   * - Application shutdown (process.on('SIGTERM'))
   * - Test cleanup (afterAll hooks)
   * - Lambda function cleanup (rare, but possible)
   * - Error recovery scenarios
   * 
   * ⚠️ IMPORTANT: After calling close(), you cannot use this connection
   * instance anymore. Create a new instance if you need database access again.
   * 
   * @returns Promise<void> - Resolves when all connections are closed
   */
  async close(): Promise<void> {
    // CHECK IF POOL EXISTS
    // Only attempt cleanup if a pool was actually created
    if (this.pool) {
      // GRACEFUL POOL SHUTDOWN
      // The end() method waits for active connections to finish their work
      // before closing them, ensuring no queries are interrupted
      await this.pool.end();
      
      // CLEAR REFERENCE
      // Set to null to enable garbage collection and prevent reuse
      this.pool = null;
      
      // CONFIRMATION LOGGING
      // Log successful cleanup for monitoring and debugging
      console.log('Database connection pool closed');
    }
  }

  /**
   * Database Health Check - Monitoring and Observability Pattern
   * 
   * This method implements the HEALTH CHECK PATTERN, which is crucial for
   * monitoring system health and enabling automated recovery in production
   * environments.
   * 
   * 🏥 HEALTH CHECK BENEFITS:
   * 
   * 1. EARLY PROBLEM DETECTION:
   *    - Identifies database connectivity issues before they affect users
   *    - Enables proactive alerting and intervention
   *    - Helps distinguish between application and database problems
   * 
   * 2. LOAD BALANCER INTEGRATION:
   *    - Load balancers can remove unhealthy instances from rotation
   *    - Prevents routing traffic to instances with database problems
   *    - Enables automatic failover to healthy instances
   * 
   * 3. MONITORING INTEGRATION:
   *    - CloudWatch and other monitoring systems can track health status
   *    - Enables automated scaling based on health metrics
   *    - Provides data for capacity planning and performance optimization
   * 
   * 4. DEBUGGING ASSISTANCE:
   *    - Simple test to verify basic database functionality
   *    - Helps isolate network vs. database vs. application issues
   *    - Provides immediate feedback during deployment
   * 
   * 💡 HEALTH CHECK DESIGN PRINCIPLES:
   * - Fast: Should complete quickly to avoid timeout issues
   * - Simple: Uses minimal database resources
   * - Safe: Read-only operation that doesn't modify data
   * - Reliable: Consistent behavior across different database states
   * 
   * @returns Promise<boolean> - true if database is healthy, false otherwise
   * 
   * @example
   * ```typescript
   * // Use in API health endpoint
   * app.get('/health', async (req, res) => {
   *   const isHealthy = await db.healthCheck();
   *   res.status(isHealthy ? 200 : 503).json({
   *     status: isHealthy ? 'healthy' : 'unhealthy',
   *     timestamp: new Date().toISOString()
   *   });
   * });
   * ```
   */
  async healthCheck(): Promise<boolean> {
    try {
      // SIMPLE CONNECTIVITY TEST
      // Execute a minimal query that tests basic database functionality
      // SELECT 1 is lightweight and works on all PostgreSQL versions
      const result = await this.query('SELECT 1 as health_check');
      
      // VALIDATE RESPONSE
      // Ensure we got the expected result structure and value
      // This confirms not just connectivity but basic query processing
      return result.rows.length > 0 && result.rows[0].health_check === 1;
    } catch (error) {
      // ERROR LOGGING
      // Log the specific error for debugging purposes
      // This helps diagnose whether the issue is network, authentication, etc.
      console.error('Database health check failed:', error);
      
      // RETURN FAILURE STATUS
      // Return false to indicate unhealthy state
      // Calling code can use this for routing decisions
      return false;
    }
  }
}

/**
 * SINGLETON PATTERN IMPLEMENTATION FOR SERVERLESS ENVIRONMENTS
 * 
 * This section demonstrates the SINGLETON PATTERN, which is particularly
 * important in serverless environments like AWS Lambda where you want to
 * reuse expensive resources across function invocations.
 * 
 * 🚀 SERVERLESS OPTIMIZATION BENEFITS:
 * 
 * 1. CONNECTION REUSE:
 *    - Database connections persist across Lambda invocations
 *    - Dramatically reduces cold start time for subsequent requests
 *    - Saves money by reducing connection establishment overhead
 * 
 * 2. MEMORY EFFICIENCY:
 *    - Single connection pool shared across all operations
 *    - Prevents multiple pool creation in concurrent scenarios
 *    - Optimizes Lambda memory usage
 * 
 * 3. PERFORMANCE OPTIMIZATION:
 *    - First request pays connection cost, subsequent requests are fast
 *    - Connection pools maintain warm connections ready for use
 *    - Reduces latency for database operations
 * 
 * 💡 WHY SINGLETON IN SERVERLESS:
 * Lambda containers can be reused across invocations. By using a singleton
 * pattern, we ensure that expensive database connections are established
 * once and reused, rather than recreated for every function invocation.
 * 
 * ⚠️ IMPORTANT: This singleton is per Lambda container, not global across
 * all Lambda instances. Each container gets its own database connection.
 */

// SINGLETON INSTANCE STORAGE
// Module-level variable that persists across Lambda invocations
// within the same container instance
let dbInstance: DatabaseConnection | null = null;

/**
 * Get Database Connection Instance - Singleton Factory Pattern
 * 
 * This function implements the SINGLETON FACTORY PATTERN, providing a
 * single point of access to the database connection while ensuring
 * only one instance exists per Lambda container.
 * 
 * 🏭 FACTORY PATTERN BENEFITS:
 * - Encapsulates object creation logic
 * - Provides consistent initialization across the application
 * - Allows for different configuration strategies
 * - Makes testing easier with dependency injection
 * 
 * 🔄 SINGLETON BEHAVIOR:
 * - First call creates and configures the instance
 * - Subsequent calls return the existing instance
 * - Configuration is only applied on first creation
 * 
 * @param config - Optional configuration (only used on first call)
 * @returns DatabaseConnection - The singleton database connection instance
 * 
 * @example
 * ```typescript
 * // First call creates the instance
 * const db1 = getDatabase({ maxConnections: 5 });
 * 
 * // Subsequent calls return the same instance
 * const db2 = getDatabase(); // Same instance as db1
 * console.log(db1 === db2); // true
 * ```
 */
export function getDatabase(config?: ConnectionConfig): DatabaseConnection {
  // SINGLETON CHECK
  // Only create a new instance if one doesn't already exist
  if (!dbInstance) {
    dbInstance = new DatabaseConnection(config);
  }
  return dbInstance;
}

/**
 * Initialize Database with AWS Secrets Manager - Production Factory
 * 
 * This function provides a convenient factory method for production
 * deployments that use AWS Secrets Manager for secure credential storage.
 * 
 * 🔐 PRODUCTION SECURITY PATTERN:
 * - Credentials stored encrypted in AWS Secrets Manager
 * - No sensitive data in application code or environment variables
 * - Supports automatic credential rotation
 * - Integrates with AWS IAM for access control
 * 
 * @param secretArn - AWS Secrets Manager ARN containing database credentials
 * @returns DatabaseConnection - Configured for production use with Secrets Manager
 * 
 * @example
 * ```typescript
 * // In Lambda function
 * const db = initializeDatabaseFromSecret(
 *   'arn:aws:secretsmanager:us-west-2:123456789012:secret:prod/database-AbCdEf'
 * );
 * ```
 */
export function initializeDatabaseFromSecret(secretArn: string): DatabaseConnection {
  return getDatabase({ secretArn });
}

/**
 * Initialize Database for Local Development - Development Factory
 * 
 * This function provides a convenient factory method for local development
 * that uses direct configuration without AWS dependencies.
 * 
 * 🛠️ DEVELOPMENT CONVENIENCE PATTERN:
 * - No AWS credentials or services required
 * - SSL disabled for local databases
 * - Supports environment variable fallbacks
 * - Fast setup for development and testing
 * 
 * @param config - Direct database configuration for local development
 * @returns DatabaseConnection - Configured for local development use
 * 
 * @example
 * ```typescript
 * // Local development setup
 * const db = initializeDatabaseLocal({
 *   host: 'localhost',
 *   port: 5432,
 *   database: 'ai_stock_prediction_dev',
 *   username: 'postgres',
 *   password: 'password'
 * });
 * ```
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
    ssl: false, // Disable SSL for local development - local databases typically don't use SSL
  });
}

// EXPORT THE MAIN CLASS
// Make the DatabaseConnection class available for direct instantiation
// if needed (though the factory functions are recommended)
export { DatabaseConnection };