#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AiStockPredictionStack } from '../lib/ai-stock-prediction-stack';
import { DatabaseStack } from '../lib/database-stack';
import { S3Stack } from '../lib/s3-stack';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

// Create S3 stack first (no dependencies)
const s3Stack = new S3Stack(app, 'AiStockPredictionS3Stack', { env });

// Create database stack
const databaseStack = new DatabaseStack(app, 'AiStockPredictionDatabaseStack', { env });

// Keep the original stack for now (can be removed later)
new AiStockPredictionStack(app, 'AiStockPredictionStack', { env });