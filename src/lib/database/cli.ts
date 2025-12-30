#!/usr/bin/env node

import { Command } from 'commander';
import { initializeDatabaseLocal, initializeDatabaseFromSecret } from './connection';
import { runMigrations, getMigrationStatus, DatabaseMigrator } from './migrate';
import { seedDatabase } from './seeds/development';

const program = new Command();

// Helper to get default values from environment
const getEnvDefaults = () => ({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || '5432',
  database: process.env.DB_NAME || 'ai_stock_prediction',
  username: process.env.DB_USER || process.env.USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

program
  .name('db-cli')
  .description('Database management CLI for AI Stock Prediction')
  .version('1.0.0');

// Migration commands
program
  .command('migrate')
  .description('Run database migrations')
  .option('--secret-arn <arn>', 'AWS Secrets Manager ARN for database credentials')
  .option('--host <host>', 'Database host (for local development)')
  .option('--port <port>', 'Database port')
  .option('--database <database>', 'Database name')
  .option('--username <username>', 'Database username')
  .option('--password <password>', 'Database password')
  .action(async (options) => {
    try {
      console.log('Running database migrations...');
      const defaults = getEnvDefaults();
      
      const db = options.secretArn
        ? initializeDatabaseFromSecret(options.secretArn)
        : initializeDatabaseLocal({
            host: options.host || defaults.host,
            port: parseInt(options.port || defaults.port),
            database: options.database || defaults.database,
            username: options.username || defaults.username,
            password: options.password || defaults.password,
          });

      await runMigrations(db);
      await db.close();
      
      console.log('Migrations completed successfully!');
    } catch (error) {
      console.error('Migration failed:', error);
      process.exit(1);
    }
  });

program
  .command('migrate:status')
  .description('Check migration status')
  .option('--secret-arn <arn>', 'AWS Secrets Manager ARN for database credentials')
  .option('--host <host>', 'Database host (for local development)')
  .option('--port <port>', 'Database port')
  .option('--database <database>', 'Database name')
  .option('--username <username>', 'Database username')
  .option('--password <password>', 'Database password')
  .action(async (options) => {
    try {
      const defaults = getEnvDefaults();
      const db = options.secretArn
        ? initializeDatabaseFromSecret(options.secretArn)
        : initializeDatabaseLocal({
            host: options.host || defaults.host,
            port: parseInt(options.port || defaults.port),
            database: options.database || defaults.database,
            username: options.username || defaults.username,
            password: options.password || defaults.password,
          });

      const status = await getMigrationStatus(db);
      await db.close();
      
      console.log('\n=== Migration Status ===');
      console.log(`Executed migrations: ${status.executed.length}`);
      console.log(`Pending migrations: ${status.pending.length}`);
      
      if (status.executed.length > 0) {
        console.log('\nExecuted:');
        status.executed.forEach(migration => {
          console.log(`  ✓ ${migration.id}_${migration.name} (${migration.executed_at})`);
        });
      }
      
      if (status.pending.length > 0) {
        console.log('\nPending:');
        status.pending.forEach(migration => {
          console.log(`  ○ ${migration}`);
        });
      }
      
    } catch (error) {
      console.error('Failed to check migration status:', error);
      process.exit(1);
    }
  });

program
  .command('migrate:reset')
  .description('Reset database (WARNING: This will drop all tables)')
  .option('--secret-arn <arn>', 'AWS Secrets Manager ARN for database credentials')
  .option('--host <host>', 'Database host (for local development)')
  .option('--port <port>', 'Database port')
  .option('--database <database>', 'Database name')
  .option('--username <username>', 'Database username')
  .option('--password <password>', 'Database password')
  .option('--confirm', 'Confirm the reset operation')
  .action(async (options) => {
    if (!options.confirm) {
      console.error('ERROR: This operation will destroy all data!');
      console.error('Use --confirm flag to proceed: npm run db:reset -- --confirm');
      process.exit(1);
    }
    
    try {
      console.log('WARNING: Resetting database - all data will be lost!');
      const defaults = getEnvDefaults();
      
      const db = options.secretArn
        ? initializeDatabaseFromSecret(options.secretArn)
        : initializeDatabaseLocal({
            host: options.host || defaults.host,
            port: parseInt(options.port || defaults.port),
            database: options.database || defaults.database,
            username: options.username || defaults.username,
            password: options.password || defaults.password,
          });

      const migrator = new DatabaseMigrator(db);
      await migrator.reset();
      await db.close();
      
      console.log('Database reset completed!');
    } catch (error) {
      console.error('Database reset failed:', error);
      process.exit(1);
    }
  });

// Seed commands
program
  .command('seed')
  .description('Seed database with development data')
  .option('--secret-arn <arn>', 'AWS Secrets Manager ARN for database credentials')
  .option('--host <host>', 'Database host (for local development)')
  .option('--port <port>', 'Database port')
  .option('--database <database>', 'Database name')
  .option('--username <username>', 'Database username')
  .option('--password <password>', 'Database password')
  .option('--no-clear', 'Do not clear existing data before seeding')
  .action(async (options) => {
    try {
      console.log('Seeding database with development data...');
      const defaults = getEnvDefaults();
      
      const db = options.secretArn
        ? initializeDatabaseFromSecret(options.secretArn)
        : initializeDatabaseLocal({
            host: options.host || defaults.host,
            port: parseInt(options.port || defaults.port),
            database: options.database || defaults.database,
            username: options.username || defaults.username,
            password: options.password || defaults.password,
          });

      await seedDatabase(db, !options.noClear);
      await db.close();
      
      console.log('Database seeding completed successfully!');
    } catch (error) {
      console.error('Database seeding failed:', error);
      process.exit(1);
    }
  });

// Health check command
program
  .command('health')
  .description('Check database connection health')
  .option('--secret-arn <arn>', 'AWS Secrets Manager ARN for database credentials')
  .option('--host <host>', 'Database host (for local development)')
  .option('--port <port>', 'Database port')
  .option('--database <database>', 'Database name')
  .option('--username <username>', 'Database username')
  .option('--password <password>', 'Database password')
  .action(async (options) => {
    try {
      const defaults = getEnvDefaults();
      const db = options.secretArn
        ? initializeDatabaseFromSecret(options.secretArn)
        : initializeDatabaseLocal({
            host: options.host || defaults.host,
            port: parseInt(options.port || defaults.port),
            database: options.database || defaults.database,
            username: options.username || defaults.username,
            password: options.password || defaults.password,
          });

      const isHealthy = await db.healthCheck();
      await db.close();
      
      if (isHealthy) {
        console.log('✓ Database connection is healthy');
      } else {
        console.log('✗ Database connection failed');
        process.exit(1);
      }
    } catch (error) {
      console.error('Health check failed:', error);
      process.exit(1);
    }
  });

// Setup command (migrate + seed)
program
  .command('setup')
  .description('Setup database (migrate + seed)')
  .option('--secret-arn <arn>', 'AWS Secrets Manager ARN for database credentials')
  .option('--host <host>', 'Database host (for local development)')
  .option('--port <port>', 'Database port')
  .option('--database <database>', 'Database name')
  .option('--username <username>', 'Database username')
  .option('--password <password>', 'Database password')
  .action(async (options) => {
    try {
      console.log('Setting up database (migrate + seed)...');
      const defaults = getEnvDefaults();
      
      const db = options.secretArn
        ? initializeDatabaseFromSecret(options.secretArn)
        : initializeDatabaseLocal({
            host: options.host || defaults.host,
            port: parseInt(options.port || defaults.port),
            database: options.database || defaults.database,
            username: options.username || defaults.username,
            password: options.password || defaults.password,
          });

      // Run migrations first
      await runMigrations(db);
      
      // Then seed with development data
      await seedDatabase(db, true);
      
      await db.close();
      
      console.log('Database setup completed successfully!');
    } catch (error) {
      console.error('Database setup failed:', error);
      process.exit(1);
    }
  });

program.parse();