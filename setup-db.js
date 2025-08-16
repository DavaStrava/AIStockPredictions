#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up AI Stock Prediction Database...\n');

// Check if PostgreSQL is running
try {
  execSync('pg_isready -h localhost -p 5432', { stdio: 'ignore' });
  console.log('✅ PostgreSQL is running');
} catch (error) {
  console.log('❌ PostgreSQL is not running. Please start PostgreSQL first.');
  console.log('   On macOS with Homebrew: brew services start postgresql');
  console.log('   On Ubuntu: sudo service postgresql start');
  process.exit(1);
}

// Create database if it doesn't exist
try {
  execSync('createdb ai_stock_prediction', { stdio: 'ignore' });
  console.log('✅ Database "ai_stock_prediction" created');
} catch (error) {
  console.log('ℹ️  Database "ai_stock_prediction" already exists');
}

// Run migrations
try {
  console.log('🔄 Running database migrations...');
  execSync('npm run db:migrate', { stdio: 'inherit' });
  console.log('✅ Migrations completed');
} catch (error) {
  console.log('❌ Migration failed:', error.message);
  process.exit(1);
}

// Seed development data
try {
  console.log('🌱 Seeding development data...');
  execSync('npm run db:seed', { stdio: 'inherit' });
  console.log('✅ Development data seeded');
} catch (error) {
  console.log('❌ Seeding failed:', error.message);
  process.exit(1);
}

console.log('\n🎉 Database setup complete!');
console.log('   You can now run: npm run dev');