import * as ram from '@aws-cdk/aws-ram';
import * as cdk from '@aws-cdk/core';

import * as tg from '../constructs/transit-gateway';

export interface TransitGatewayStackProps extends cdk.StackProps {
  resourceShareName?: string;
  accountsToShareWith?: string[];
}

export class TransitGatewayStack extends cdk.Stack {
  public readonly transitGateway: tg.ITransitGateway;
  public readonly defaultRouteTable: tg.ITgwRouteTable;

  constructor(scope: cdk.Construct, id: string, props: TransitGatewayStackProps = {}) {
    super(scope, id, props);

    this.transitGateway = new tg.TransitGateway(this, 'TransitGateway');

    this.defaultRouteTable = new tg.TgwRouteTable(this, 'DefaultRouteTable', {
      transitGateway: this.transitGateway,
      name: 'DefaultRouteTable',
    });

    new ram.CfnResourceShare(this, 'Share', {
      name: props.resourceShareName ?? 'TGW-Share',
      allowExternalPrincipals: false,
      resourceArns: [this.transitGateway.transitGatewayArn],
      principals: props.accountsToShareWith,
    });
  }
}
