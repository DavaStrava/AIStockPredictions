import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
export declare class S3Stack extends cdk.Stack {
    readonly dataBucket: s3.Bucket;
    constructor(scope: Construct, id: string, props?: cdk.StackProps);
}
