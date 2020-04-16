import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';

export interface VpcExampleProps extends cdk.StackProps {
}

export class VpcExample extends cdk.Stack {
  public readonly vpc: ec2.IVpc;

  constructor(scope: cdk.Construct, id: string, props?: VpcExampleProps) {
    super(scope, id, props);

    this.vpc = new ec2.Vpc(this, 'tgw-vpc', {
      cidr: "10.2.0.0/16",
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        {
          name: 'isolated',
          subnetType: ec2.SubnetType.ISOLATED,
        },
      ]
    });

  }
}
