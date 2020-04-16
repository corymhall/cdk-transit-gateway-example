import * as cdk from '@aws-cdk/core';
import * as table from './tgw-route-table';
import * as ram from '@aws-cdk/aws-ram';

import * as tg from './transit-gateway';

export interface TransitGatewayProps extends cdk.StackProps {
  resourceShareName?: string;
  accountsToShareWith?: string[];
}

export class TransitGatewayExample extends cdk.Stack {
  public readonly transitGateway: tg.ITransitGateway;
  public readonly defaultRouteTable: table.ITgwRouteTable;

  constructor(scope: cdk.Construct, id: string, props: TransitGatewayProps = {}) {
    super(scope, id, props);

    this.transitGateway = new tg.TransitGateway(this, 'TransitGateway');

    this.defaultRouteTable = new table.TgwRouteTable(this, 'DefaultRouteTable', {
      transitGateway: this.transitGateway,
      name: 'DefaultRouteTable'
    });

    new ram.CfnResourceShare(this, 'Share', {
      name: props.resourceShareName ?? 'TGW-Share',
      allowExternalPrincipals: false,
      resourceArns: [this.transitGateway.transitGatewayArn],
      principals: props.accountsToShareWith
    });
  }
}
