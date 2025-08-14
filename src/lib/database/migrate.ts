import { readFileSync } from 'fs';
import { join } from 'path';
import { DatabaseConnection } from './connection';

interface Migration {
  id: string;
  name: string;
  sql: string;
}

interface MigrationRecord {
  id: string;
  name: string;
  executed_at: Date;
}

export class DatabaseMigrator {
  private db: DatabaseConnection;
  private migrationsPath: string;

  constructor(db: DatabaseConnection, migrationsPath?: string) {
    this.db = db;
    this.migrationsPath = migrationsPath || join(__dirname, 'migrations');
  }

  /**
   * Create migrations tracking table if it doesn't exist
   */
  private async createMigrationsTable(): Promise<void> {
    const sql = `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_schema_migrations_executed_at 
      ON schema_migrations(executed_at);
    `;

    await this.db.query(sql);
  }

  /**
   * Get list of executed migrations
   */
  private async getExecutedMigrations(): Promise<MigrationRecord[]> {
    const result = await this.db.query(`
      SELECT id, name, executed_at 
      FROM schema_migrations 
      ORDER BY executed_at ASC
    `);
    
    return result.rows;
  }

  /**
   * Load migration files from the migrations directory
   */
  private loadMigrations(): Migration[] {
    const migrations: Migration[] = [];
    
    // For now, we'll manually define migrations
    // In a real application, you might scan the directory
    const migrationFiles = [
      '001_initial_schema.sql',
    ];

    for (const filename of migrationFiles) {
      try {
        const filePath = join(this.migrationsPath, filename);
        const sql = readFileSync(filePath, 'utf8');
        const [id, ...nameParts] = filename.replace('.sql', '').split('_');
        
        migrations.push({
          id,
          name: nameParts.join('_'),
          sql,
        });
      } catch (error) {
        console.error(`Failed to load migration ${filename}:`, error);
        throw error;
      }
    }

    return migrations.sort((a, b) => a.id.localeCompare(b.id));
  }

  /**
   * Execute a single migration
   */
  private async executeMigration(migration: Migration): Promise<void> {
    console.log(`Executing migration ${migration.id}: ${migration.name}`);
    
    await this.db.transaction(async (client) => {
      // Execute the migration SQL
      await client.query(migration.sql);
      
      // Record the migration as executed
      await client.query(
        'INSERT INTO schema_migrations (id, name) VALUES ($1, $2)',
        [migration.id, migration.name]
      );
    });
    
    console.log(`Migration ${migration.id} completed successfully`);
  }

  /**
   * Run all pending migrations
   */
  async migrate(): Promise<void> {
    console.log('Starting database migration...');
    
    try {
      // Create migrations table if it doesn't exist
      await this.createMigrationsTable();
      
      // Get executed migrations
      const executedMigrations = await this.getExecutedMigrations();
      const executedIds = new Set(executedMigrations.map(m => m.id));
      
      // Load available migrations
      const availableMigrations = this.loadMigrations();
      
      // Find pending migrations
      const pendingMigrations = availableMigrations.filter(
        migration => !executedIds.has(migration.id)
      );
      
      if (pendingMigrations.length === 0) {
        console.log('No pending migrations found');
        return;
      }
      
      console.log(`Found ${pendingMigrations.length} pending migrations`);
      
      // Execute pending migrations
      for (const migration of pendingMigrations) {
        await this.executeMigration(migration);
      }
      
      console.log('All migrations completed successfully');
      
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }

  /**
   * Get migration status
   */
  async getStatus(): Promise<{
    executed: MigrationRecord[];
    pending: string[];
  }> {
    await this.createMigrationsTable();
    
    const executedMigrations = await this.getExecutedMigrations();
    const executedIds = new Set(executedMigrations.map(m => m.id));
    
    const availableMigrations = this.loadMigrations();
    const pendingMigrations = availableMigrations
      .filter(migration => !executedIds.has(migration.id))
      .map(migration => `${migration.id}_${migration.name}`);
    
    return {
      executed: executedMigrations,
      pending: pendingMigrations,
    };
  }

  /**
   * Reset database (WARNING: This will drop all tables)
   */
  async reset(): Promise<void> {
    console.warn('WARNING: Resetting database - all data will be lost!');
    
    const sql = `
      -- Drop all tables
      DROP TABLE IF EXISTS insights CASCADE;
      DROP TABLE IF EXISTS backtest_results CASCADE;
      DROP TABLE IF EXISTS predictions CASCADE;
      DROP TABLE IF EXISTS market_data CASCADE;
      DROP TABLE IF EXISTS watchlist_stocks CASCADE;
      DROP TABLE IF EXISTS watchlists CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP TABLE IF EXISTS schema_migrations CASCADE;
      
      -- Drop extensions (optional)
      DROP EXTENSION IF EXISTS vector CASCADE;
      DROP EXTENSION IF EXISTS pgcrypto CASCADE;
      DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;
      
      -- Drop functions
      DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
      DROP FUNCTION IF EXISTS find_similar_insights(VECTOR, FLOAT, INTEGER) CASCADE;
      DROP FUNCTION IF EXISTS cleanup_expired_insights() CASCADE;
      
      -- Drop views
      DROP VIEW IF EXISTS recent_predictions CASCADE;
    `;
    
    await this.db.query(sql);
    console.log('Database reset completed');
  }
}

/**
 * Convenience function to run migrations
 */
export async function runMigrations(db: DatabaseConnection): Promise<void> {
  const migrator = new DatabaseMigrator(db);
  await migrator.migrate();
}

/**
 * Convenience function to get migration status
 */
export async function getMigrationStatus(db: DatabaseConnection) {
  const migrator = new DatabaseMigrator(db);
  return await migrator.getStatus();
}