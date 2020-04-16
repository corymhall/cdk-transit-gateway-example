import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as attachment from './transit-gateway-attachment';
import * as table from './tgw-route-table';

export interface TransitGatewayProps {
  transitGatewayName?: string;
  amazonSideAsn?: number;
  autoAcceptSharedAttachments?: boolean;
}

export interface ITransitGateway {
  readonly transitGatewayId: string;
  readonly transitGatewayArn: string;
  readonly defaultRouteTable: table.ITgwRouteTable;

  addVpcAttachment(vpc: ec2.IVpc, subnets: ec2.SubnetSelection): attachment.ITransitGatewayAttachment;
}

export class TransitGateway extends cdk.Construct implements ITransitGateway {
  public readonly transitGatewayId: string;
  public readonly transitGatewayArn: string;
  public readonly defaultRouteTable: table.ITgwRouteTable;

  constructor(scope: cdk.Construct, id: string, props: TransitGatewayProps = {}) {
    super(scope, id);

    const transitGateway = new ec2.CfnTransitGateway(this, 'TransitGateway', {
      tags: [{
        key: 'Name',
        value: props.transitGatewayName ?? 'OrgTransitGateway'
      }],
      defaultRouteTableAssociation: 'disable',
      defaultRouteTablePropagation: 'disable',
      autoAcceptSharedAttachments: props.autoAcceptSharedAttachments === undefined ? 'enable' :
        props.autoAcceptSharedAttachments ? 'enable' : 'disable',
      amazonSideAsn: props.amazonSideAsn ?? 65432
    });

    this.transitGatewayId = transitGateway.ref;
    this.transitGatewayArn = cdk.Stack.of(this).formatArn({
      service: 'ec2',
      resource: 'transit-gateway',
      resourceName: this.transitGatewayId
    });
  }

  public addVpcAttachment(vpc: ec2.IVpc, subnets: ec2.SubnetSelection): attachment.ITransitGatewayAttachment {
    const att = new attachment.TransitGatewayAttachment(cdk.Stack.of(vpc), `attachment`, {
      vpc: vpc,
      transitGateway: this,
      subnets: subnets
    });

    vpc.selectSubnets(subnets).subnets.forEach((value, index) => {
      const route = new ec2.CfnRoute(cdk.Stack.of(vpc), `TGWRoute${index}`, {
        routeTableId: value.routeTable.routeTableId,
        destinationCidrBlock: '10.0.0.0/16',
        transitGatewayId: att.transitGatewayId
      });
      // route.addDependsOn(att)
    });

    return att
  }
}
