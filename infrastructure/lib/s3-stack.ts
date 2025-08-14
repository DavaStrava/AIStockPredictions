import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class S3Stack extends cdk.Stack {
  public readonly dataBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create S3 bucket for data lake
    this.dataBucket = new s3.Bucket(this, 'DataLakeBucket', {
      bucketName: `ai-stock-prediction-data-${this.account}-${this.region}`,
      versioned: false, // Disable versioning to save costs
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      lifecycleRules: [
        {
          id: 'DeleteOldRawData',
          enabled: true,
          prefix: 'raw/',
          expiration: cdk.Duration.days(90), // Delete raw data after 90 days
        },
        {
          id: 'TransitionProcessedData',
          enabled: true,
          prefix: 'processed/',
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
        },
        {
          id: 'DeleteOldPredictions',
          enabled: true,
          prefix: 'predictions/',
          expiration: cdk.Duration.days(365), // Keep predictions for 1 year
        },
      ],
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.POST],
          allowedOrigins: ['*'], // Restrict this in production
          allowedHeaders: ['*'],
          maxAge: 3000,
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Change to RETAIN in production
    });

    // Create IAM role for Lambda functions to access S3
    const lambdaS3Role = new iam.Role(this, 'LambdaS3AccessRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Role for Lambda functions to access S3 data lake',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
      inlinePolicies: {
        S3DataLakeAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObject',
                's3:PutObject',
                's3:DeleteObject',
                's3:ListBucket',
              ],
              resources: [
                this.dataBucket.bucketArn,
                `${this.dataBucket.bucketArn}/*`,
              ],
            }),
          ],
        }),
      },
    });

    // Output important values
    new cdk.CfnOutput(this, 'DataLakeBucketName', {
      value: this.dataBucket.bucketName,
      description: 'S3 data lake bucket name',
    });

    new cdk.CfnOutput(this, 'DataLakeBucketArn', {
      value: this.dataBucket.bucketArn,
      description: 'S3 data lake bucket ARN',
    });

    new cdk.CfnOutput(this, 'LambdaS3RoleArn', {
      value: lambdaS3Role.roleArn,
      description: 'IAM role ARN for Lambda S3 access',
    });

    // Export values for use in other stacks
    new cdk.CfnOutput(this, 'DataLakeBucketNameExport', {
      value: this.dataBucket.bucketName,
      exportName: 'DataLakeBucketName',
    });
  }
}