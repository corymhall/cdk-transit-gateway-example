import * as ec2 from '@aws-cdk/aws-ec2';
import * as cdk from '@aws-cdk/core';
import * as attachment from './transit-gateway-attachment';

export interface TransitGatewayProps {
  transitGatewayName?: string;
  amazonSideAsn?: number;
  autoAcceptSharedAttachments?: boolean;
}

export interface ITransitGateway extends cdk.IResource {
  readonly transitGatewayId: string;
  readonly transitGatewayArn: string;

  addVpcAttachment(vpc: ec2.IVpc, subnets: ec2.SubnetSelection): attachment.ITransitGatewayAttachment;
}

abstract class TransitGatewayBase extends cdk.Resource implements ITransitGateway {
  public abstract readonly transitGatewayId: string;
  public abstract readonly transitGatewayArn: string;

  public addVpcAttachment(vpc: ec2.IVpc, subnets: ec2.SubnetSelection): attachment.ITransitGatewayAttachment {

    if (cdk.Stack.of(this).account != cdk.Stack.of(vpc).account) {
      throw new Error('The VPC attachment and the VPC should be in the same AWS account');
    }

    const tgw = this;

    const att = new attachment.TransitGatewayAttachment(this, 'attachment', {
      vpc: vpc,
      transitGateway: tgw,
      subnets: subnets,
    });

    vpc.selectSubnets(subnets).subnets.forEach((value, index) => {
      const route = new ec2.CfnRoute(this, `TGWRoute${index}`, {
        routeTableId: value.routeTable.routeTableId,
        destinationCidrBlock: '10.0.0.0/16',
        transitGatewayId: att.transitGatewayId,
      });
      route.node.addDependency(att);
    });

    return att;
  }
}

export class TransitGateway extends TransitGatewayBase {

  public static fromTransitGatewayArn(scope: cdk.Construct, id: string, transitGatewayArn: string): ITransitGateway {
    const parts = cdk.Stack.of(scope).parseArn(transitGatewayArn);

    class Import extends TransitGatewayBase {
      public transitGatewayArn = transitGatewayArn;
      public transitGatewayId = parts.resourceName || '';
    }

    return new Import(scope, id);
  }

  public static fromTransitGatewayId(scope: cdk.Construct, id: string, transitGatewayId: string): ITransitGateway {
    class Import extends TransitGatewayBase {
      public transitGatewayId = transitGatewayId;
      public transitGatewayArn = cdk.Stack.of(scope).formatArn({
        service: 'ec2',
        resource: 'transit-gateway',
        resourceName: transitGatewayId,
      });
    }

    return new Import(scope, id);
  }

  public readonly transitGatewayId: string;
  public readonly transitGatewayArn: string;

  constructor(scope: cdk.Construct, id: string, props: TransitGatewayProps = {}) {
    super(scope, id);

    const transitGateway = new ec2.CfnTransitGateway(this, 'TransitGateway', {
      tags: [{
        key: 'Name',
        value: props.transitGatewayName ?? 'OrgTransitGateway',
      }],
      defaultRouteTableAssociation: 'disable',
      defaultRouteTablePropagation: 'disable',
      autoAcceptSharedAttachments: props.autoAcceptSharedAttachments === undefined ? 'enable' :
        props.autoAcceptSharedAttachments ? 'enable' : 'disable',
      amazonSideAsn: props.amazonSideAsn ?? 65432,
    });

    this.transitGatewayId = transitGateway.ref;
    this.transitGatewayArn = cdk.Stack.of(this).formatArn({
      service: 'ec2',
      resource: 'transit-gateway',
      resourceName: this.transitGatewayId,
    });
  }

}
