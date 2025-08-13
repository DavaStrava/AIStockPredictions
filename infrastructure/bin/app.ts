#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AiStockPredictionStack } from '../lib/ai-stock-prediction-stack';

const app = new cdk.App();
new AiStockPredictionStack(app, 'AiStockPredictionStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});