import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';

export class SandboxNetworkingStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.vpc = new ec2.Vpc(this, 'Vpc', {
      cidr: "10.4.0.0/16",
      maxAzs: 3,
      subnetConfiguration: [
        {
          name: 'dmz',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          name: 'app',
          subnetType: ec2.SubnetType.PRIVATE,
        },
        {
          name: 'db',
          subnetType: ec2.SubnetType.ISOLATED,
        }
      ]
    });
  }
}
