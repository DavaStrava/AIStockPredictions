import { DatabaseConnection } from '../connection';

/**
 * Watchlist Service - Database Layer for Stock Watchlist Management
 * 
 * This service implements the Data Access Layer (DAL) pattern, providing a clean
 * abstraction between the business logic and database operations. It encapsulates
 * all database interactions related to watchlists and their associated stocks.
 * 
 * Key Design Patterns Used:
 * - Service Layer Pattern: Encapsulates business logic and database operations
 * - Repository Pattern: Provides a uniform interface for data access
 * - Dependency Injection: DatabaseConnection is injected via constructor
 * - Interface Segregation: Clear separation between data models and request DTOs
 */

/**
 * Watchlist Domain Model
 * 
 * Represents a user's stock watchlist in the system. This interface defines
 * the complete structure of a watchlist entity as it exists in the database.
 * 
 * Design Notes:
 * - Uses string IDs (UUIDs) for better scalability and security
 * - Optional description field allows for flexible user customization
 * - Timestamps track creation and modification for audit purposes
 * - Optional stocks array supports eager loading of related data
 */
export interface Watchlist {
  id: string;                    // UUID primary key for unique identification
  userId: string;                // Foreign key linking to the user who owns this watchlist
  name: string;                  // User-defined name for the watchlist (e.g., "Tech Stocks")
  description?: string;          // Optional description for additional context
  createdAt: Date;              // Timestamp when the watchlist was created
  updatedAt: Date;              // Timestamp when the watchlist was last modified
  stocks?: WatchlistStock[];    // Optional array of stocks (populated via JOIN queries)
}

/**
 * WatchlistStock Domain Model
 * 
 * Represents the many-to-many relationship between watchlists and stock symbols.
 * This is a junction/bridge entity that connects watchlists to specific stocks.
 * 
 * Design Notes:
 * - Separate entity allows for additional metadata (like when stock was added)
 * - Symbol is stored as string (e.g., "AAPL", "GOOGL") for flexibility
 * - addedAt timestamp helps with ordering and user experience
 */
export interface WatchlistStock {
  id: string;                   // UUID primary key for the watchlist-stock relationship
  watchlistId: string;          // Foreign key to the parent watchlist
  symbol: string;               // Stock symbol (e.g., "AAPL", "MSFT")
  addedAt: Date;               // Timestamp when this stock was added to the watchlist
}

/**
 * Data Transfer Object (DTO) for Creating Watchlists
 * 
 * This interface defines the required data for creating a new watchlist.
 * It's separate from the main Watchlist interface to avoid exposing
 * internal fields (like id, timestamps) that are managed by the system.
 * 
 * Benefits of DTOs:
 * - Clear API contracts for client applications
 * - Validation boundaries for incoming data
 * - Separation of external API from internal data models
 */
export interface CreateWatchlistRequest {
  userId: string;               // ID of the user creating the watchlist
  name: string;                 // Name for the new watchlist
  description?: string;         // Optional description
}

/**
 * Data Transfer Object (DTO) for Adding Stocks to Watchlists
 * 
 * Simple DTO that encapsulates the data needed to add a stock symbol
 * to an existing watchlist. Keeps the API clean and focused.
 */
export interface AddStockRequest {
  watchlistId: string;          // Target watchlist to add the stock to
  symbol: string;               // Stock symbol to add (will be normalized to uppercase)
}

/**
 * WatchlistService Class - Core Business Logic for Watchlist Management
 * 
 * This service class implements the Service Layer pattern, providing a high-level
 * interface for all watchlist-related operations. It encapsulates database
 * interactions and business rules while maintaining clean separation of concerns.
 * 
 * Architecture Benefits:
 * - Single Responsibility: Only handles watchlist operations
 * - Dependency Injection: Database connection injected for testability
 * - Async/Await: Modern JavaScript patterns for handling database operations
 * - Type Safety: Full TypeScript support with proper return types
 */
export class WatchlistService {
  /**
   * Constructor with Dependency Injection
   * 
   * The database connection is injected as a dependency, which provides several benefits:
   * - Testability: Easy to mock the database for unit tests
   * - Flexibility: Can swap database implementations without changing service code
   * - Separation of Concerns: Service focuses on business logic, not connection management
   * 
   * @param db - Database connection instance for executing queries
   */
  constructor(private db: DatabaseConnection) {}

  /**
   * Create a New Watchlist
   * 
   * This method demonstrates several important database patterns:
   * - Parameterized Queries: Uses $1, $2, $3 placeholders to prevent SQL injection
   * - RETURNING Clause: PostgreSQL feature that returns inserted data in one query
   * - Data Transformation: Converts snake_case database fields to camelCase TypeScript
   * 
   * Security Notes:
   * - Parameterized queries prevent SQL injection attacks
   * - Input validation should be done at the API layer before calling this method
   * 
   * @param data - The watchlist creation request containing user ID, name, and optional description
   * @returns Promise resolving to the newly created watchlist with generated ID and timestamps
   */
  async createWatchlist(data: CreateWatchlistRequest): Promise<Watchlist> {
    // SQL INSERT query with parameterized values for security
    // RETURNING clause gets the inserted data back in a single database round-trip
    const query = `
      INSERT INTO watchlists (user_id, name, description)
      VALUES ($1, $2, $3)
      RETURNING id, user_id, name, description, created_at, updated_at
    `;
    
    // Execute the query with parameterized values
    // The database driver automatically escapes values to prevent SQL injection
    const result = await this.db.query(query, [data.userId, data.name, data.description]);
    
    // Extract the first (and only) row from the result set
    const row = result.rows[0];
    
    // Transform database row (snake_case) to TypeScript interface (camelCase)
    // This mapping layer provides clean separation between database schema and application models
    return {
      id: row.id,
      userId: row.user_id,           // Convert snake_case to camelCase
      name: row.name,
      description: row.description,
      createdAt: row.created_at,     // Convert snake_case to camelCase
      updatedAt: row.updated_at,     // Convert snake_case to camelCase
    };
  }

  /**
   * Get All Watchlists for a User with Associated Stocks
   * 
   * This method demonstrates advanced SQL techniques for efficient data retrieval:
   * - LEFT JOIN: Includes watchlists even if they have no stocks
   * - JSON Aggregation: PostgreSQL's json_agg() creates nested JSON structures
   * - COALESCE: Provides fallback values for null results
   * - FILTER: Excludes null values from aggregation
   * - GROUP BY: Necessary when using aggregate functions
   * 
   * Performance Benefits:
   * - Single query instead of N+1 queries (one per watchlist)
   * - Database-level JSON aggregation is faster than application-level joins
   * - Reduced network round-trips between application and database
   * 
   * @param userId - The ID of the user whose watchlists to retrieve
   * @returns Promise resolving to array of watchlists with their associated stocks
   */
  async getUserWatchlists(userId: string): Promise<Watchlist[]> {
    // Complex SQL query that demonstrates several advanced PostgreSQL features
    const query = `
      SELECT w.id, w.user_id, w.name, w.description, w.created_at, w.updated_at,
             COALESCE(
               json_agg(
                 json_build_object(
                   'id', ws.id,
                   'symbol', ws.symbol,
                   'addedAt', ws.added_at
                 ) ORDER BY ws.added_at
               ) FILTER (WHERE ws.id IS NOT NULL), 
               '[]'
             ) as stocks
      FROM watchlists w
      LEFT JOIN watchlist_stocks ws ON w.id = ws.watchlist_id
      WHERE w.user_id = $1
      GROUP BY w.id, w.user_id, w.name, w.description, w.created_at, w.updated_at
      ORDER BY w.created_at DESC
    `;
    
    // Execute the query with the user ID parameter
    const result = await this.db.query(query, [userId]);
    
    // Transform each database row into a properly typed Watchlist object
    // The map() function applies the transformation to each element in the array
    return result.rows.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      stocks: row.stocks || [],        // Fallback to empty array if no stocks
    }));
  }

  /**
   * Get a Single Watchlist by ID with Associated Stocks
   * 
   * This method is similar to getUserWatchlists but retrieves a specific watchlist.
   * It demonstrates the "null object pattern" by returning null when no watchlist
   * is found, which is more explicit than throwing an exception.
   * 
   * Design Patterns:
   * - Null Object Pattern: Returns null instead of throwing exceptions for missing data
   * - Single Responsibility: Focused on retrieving one specific watchlist
   * - Consistent Interface: Uses same JSON aggregation pattern as getUserWatchlists
   * 
   * @param watchlistId - The unique ID of the watchlist to retrieve
   * @returns Promise resolving to the watchlist with stocks, or null if not found
   */
  async getWatchlist(watchlistId: string): Promise<Watchlist | null> {
    // Same complex query as getUserWatchlists, but filtered by watchlist ID instead of user ID
    const query = `
      SELECT w.id, w.user_id, w.name, w.description, w.created_at, w.updated_at,
             COALESCE(
               json_agg(
                 json_build_object(
                   'id', ws.id,
                   'symbol', ws.symbol,
                   'addedAt', ws.added_at
                 ) ORDER BY ws.added_at
               ) FILTER (WHERE ws.id IS NOT NULL), 
               '[]'
             ) as stocks
      FROM watchlists w
      LEFT JOIN watchlist_stocks ws ON w.id = ws.watchlist_id
      WHERE w.id = $1
      GROUP BY w.id, w.user_id, w.name, w.description, w.created_at, w.updated_at
    `;
    
    const result = await this.db.query(query, [watchlistId]);
    
    // Handle the case where no watchlist is found
    // Returning null is more explicit than throwing an exception and allows
    // the calling code to handle the "not found" case appropriately
    if (result.rows.length === 0) {
      return null;
    }
    
    // Transform the single result row into a Watchlist object
    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      stocks: row.stocks || [],
    };
  }

  /**
   * Add a Stock Symbol to a Watchlist
   * 
   * This method demonstrates several important database concepts:
   * - UPSERT Pattern: Uses ON CONFLICT to handle duplicate insertions gracefully
   * - Data Normalization: Converts stock symbols to uppercase for consistency
   * - Idempotent Operations: Can be called multiple times with same result
   * - Graceful Error Handling: Handles conflicts without throwing exceptions
   * 
   * Business Rules Implemented:
   * - Stock symbols are normalized to uppercase (AAPL, not aapl)
   * - Duplicate stocks in the same watchlist are prevented
   * - Returns the existing stock if already present (idempotent behavior)
   * 
   * @param data - Request containing watchlist ID and stock symbol to add
   * @returns Promise resolving to the watchlist stock entry (new or existing)
   */
  async addStockToWatchlist(data: AddStockRequest): Promise<WatchlistStock> {
    // INSERT with ON CONFLICT clause - PostgreSQL's UPSERT functionality
    // This prevents duplicate key errors and makes the operation idempotent
    const query = `
      INSERT INTO watchlist_stocks (watchlist_id, symbol)
      VALUES ($1, $2)
      ON CONFLICT (watchlist_id, symbol) DO NOTHING
      RETURNING id, watchlist_id, symbol, added_at
    `;
    
    // Normalize stock symbol to uppercase for consistency
    // This ensures "aapl", "AAPL", and "Aapl" are all treated as "AAPL"
    const result = await this.db.query(query, [data.watchlistId, data.symbol.toUpperCase()]);
    
    // Handle the case where the stock already exists in the watchlist
    // ON CONFLICT DO NOTHING means no rows are returned if there's a conflict
    if (result.rows.length === 0) {
      // Stock already exists, so fetch the existing record
      // This maintains idempotent behavior - same result regardless of how many times called
      const existingQuery = `
        SELECT id, watchlist_id, symbol, added_at
        FROM watchlist_stocks
        WHERE watchlist_id = $1 AND symbol = $2
      `;
      const existingResult = await this.db.query(existingQuery, [data.watchlistId, data.symbol.toUpperCase()]);
      const row = existingResult.rows[0];
      
      // Transform database row to TypeScript interface
      return {
        id: row.id,
        watchlistId: row.watchlist_id,
        symbol: row.symbol,
        addedAt: row.added_at,
      };
    }
    
    // Stock was successfully inserted, return the new record
    const row = result.rows[0];
    return {
      id: row.id,
      watchlistId: row.watchlist_id,
      symbol: row.symbol,
      addedAt: row.added_at,
    };
  }

  /**
   * Remove a Stock Symbol from a Watchlist
   * 
   * This method demonstrates a simple DELETE operation with success indication.
   * It uses the rowCount property to determine if the operation actually
   * removed a record, providing feedback to the calling code.
   * 
   * Design Patterns:
   * - Boolean Return Pattern: Returns true/false to indicate success
   * - Data Normalization: Ensures symbol is uppercase for consistent matching
   * - Idempotent Operation: Safe to call even if stock doesn't exist
   * 
   * @param watchlistId - The ID of the watchlist to remove the stock from
   * @param symbol - The stock symbol to remove (will be normalized to uppercase)
   * @returns Promise resolving to true if a stock was removed, false if not found
   */
  async removeStockFromWatchlist(watchlistId: string, symbol: string): Promise<boolean> {
    const query = `
      DELETE FROM watchlist_stocks
      WHERE watchlist_id = $1 AND symbol = $2
    `;
    
    // Execute DELETE with normalized symbol
    const result = await this.db.query(query, [watchlistId, symbol.toUpperCase()]);
    
    // rowCount indicates how many rows were affected by the DELETE operation
    // > 0 means at least one row was deleted (success)
    // = 0 means no matching rows were found (stock wasn't in watchlist)
    return result.rowCount > 0;
  }

  /**
   * Delete an Entire Watchlist
   * 
   * This method removes a watchlist and all its associated stocks.
   * The database schema should have CASCADE DELETE configured so that
   * removing a watchlist automatically removes all its stocks.
   * 
   * Important Notes:
   * - This is a destructive operation that cannot be undone
   * - Foreign key constraints with CASCADE DELETE handle cleanup of related stocks
   * - Returns boolean to indicate whether the watchlist actually existed
   * 
   * @param watchlistId - The ID of the watchlist to delete
   * @returns Promise resolving to true if watchlist was deleted, false if not found
   */
  async deleteWatchlist(watchlistId: string): Promise<boolean> {
    const query = `DELETE FROM watchlists WHERE id = $1`;
    const result = await this.db.query(query, [watchlistId]);
    
    // Return true if a watchlist was actually deleted
    return result.rowCount > 0;
  }

  /**
   * Update Watchlist Properties (Partial Update)
   * 
   * This method demonstrates dynamic SQL generation for partial updates.
   * It only updates the fields that are provided, leaving others unchanged.
   * This is more efficient and safer than always updating all fields.
   * 
   * Advanced Techniques Demonstrated:
   * - Dynamic SQL Generation: Builds query based on provided fields
   * - Partial Updates: Only updates specified fields
   * - Parameter Indexing: Dynamically manages SQL parameter positions
   * - Automatic Timestamp Updates: Sets updated_at to current time
   * - Early Return Optimization: Avoids unnecessary database calls
   * 
   * @param watchlistId - The ID of the watchlist to update
   * @param updates - Object containing the fields to update (name and/or description)
   * @returns Promise resolving to updated watchlist or null if not found
   */
  async updateWatchlist(watchlistId: string, updates: { name?: string; description?: string }): Promise<Watchlist | null> {
    // Arrays to build the dynamic SQL query
    const setParts = [];      // Will hold "field = $n" strings
    const values = [];        // Will hold the actual values to update
    let paramIndex = 1;       // Track parameter position for SQL placeholders

    if (updates.name !== undefined) {
      setParts.push(`name = $${paramIndex++}`);
      values.push(updates.name);
    }

    if (updates.description !== undefined) {
      setParts.push(`description = $${paramIndex++}`);
      values.push(updates.description);
    }

    // Early return if no fields to update - avoids unnecessary database call
    // This is an optimization that also maintains idempotent behavior
    if (setParts.length === 0) {
      return this.getWatchlist(watchlistId);
    }

    // Add the watchlist ID as the final parameter
    values.push(watchlistId);
    
    const query = `
      UPDATE watchlists 
      SET ${setParts.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
      RETURNING id, user_id, name, description, created_at, updated_at
    `;
    
    const result = await this.db.query(query, values);
    
    // Handle case where watchlist doesn't exist
    if (result.rows.length === 0) {
      return null;
    }
    
    // Transform and return the updated watchlist
    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Get Stock Symbols from a Watchlist
   * 
   * This is a utility method that returns just the stock symbols from a watchlist,
   * ordered by when they were added. This is useful when you only need the symbols
   * without the full watchlist metadata.
   * 
   * Use Cases:
   * - Feeding stock symbols to external APIs for price data
   * - Quick validation of watchlist contents
   * - Generating reports or exports
   * 
   * @param watchlistId - The ID of the watchlist to get stocks from
   * @returns Promise resolving to array of stock symbols (e.g., ["AAPL", "GOOGL"])
   */
  async getWatchlistStocks(watchlistId: string): Promise<string[]> {
    const query = `
      SELECT symbol FROM watchlist_stocks 
      WHERE watchlist_id = $1 
      ORDER BY added_at
    `;
    
    const result = await this.db.query(query, [watchlistId]);
    
    // Extract just the symbol field from each row and return as string array
    // The map() function transforms the array of row objects into an array of strings
    return result.rows.map((row: any) => row.symbol);
  }
}

/**
 * EDUCATIONAL SUMMARY: Key Concepts Demonstrated in WatchlistService
 * 
 * This service class demonstrates several important software engineering patterns
 * and database concepts that are valuable for learning:
 * 
 * 1. SERVICE LAYER PATTERN
 *    - Encapsulates business logic and database operations
 *    - Provides clean API for other parts of the application
 *    - Separates concerns between data access and business rules
 * 
 * 2. DEPENDENCY INJECTION
 *    - Database connection injected via constructor
 *    - Makes the class testable and flexible
 *    - Follows SOLID principles (Dependency Inversion)
 * 
 * 3. SQL BEST PRACTICES
 *    - Parameterized queries prevent SQL injection attacks
 *    - RETURNING clause reduces database round-trips
 *    - LEFT JOINs handle optional relationships gracefully
 *    - JSON aggregation creates efficient nested data structures
 * 
 * 4. ERROR HANDLING PATTERNS
 *    - Null object pattern for missing data
 *    - Boolean returns for success/failure operations
 *    - Graceful handling of constraint violations (ON CONFLICT)
 * 
 * 5. DATA TRANSFORMATION
 *    - Consistent mapping between database (snake_case) and TypeScript (camelCase)
 *    - Type-safe interfaces ensure data integrity
 *    - DTOs separate external API from internal models
 * 
 * 6. PERFORMANCE OPTIMIZATIONS
 *    - Single queries instead of N+1 query problems
 *    - Early returns to avoid unnecessary work
 *    - Database-level JSON aggregation
 *    - Proper indexing considerations (foreign keys, unique constraints)
 * 
 * This service serves as a solid foundation for building scalable,
 * maintainable database access layers in TypeScript applications.
 */
}