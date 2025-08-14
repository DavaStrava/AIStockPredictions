import * as cdk from 'aws-cdk-lib';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
export declare class DatabaseStack extends cdk.Stack {
    readonly cluster: rds.DatabaseCluster;
    readonly secret: secretsmanager.Secret;
    readonly vpc: ec2.Vpc;
    constructor(scope: Construct, id: string, props?: cdk.StackProps);
}
