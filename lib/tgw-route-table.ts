import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import { ITransitGateway } from './transit-gateway';
import { ITransitGatewayAttachment } from './transit-gateway-attachment';

export interface TgwRouteTableProps {
  transitGateway: ITransitGateway;
  name: string;
}

export interface ITgwRouteTable {
  readonly id: string;

  addPropagation(attachment: ITransitGatewayAttachment): void;
  addAssociation(attachment: ITransitGatewayAttachment): void;
}

export class TgwRouteTable extends cdk.Construct implements ITgwRouteTable {
  public readonly id: string;

  constructor(scope: cdk.Construct, id: string, props: TgwRouteTableProps) {
    super(scope, id);

    const routeTable = new ec2.CfnTransitGatewayRouteTable(this, 'RouteTable', {
      transitGatewayId: props.transitGateway.transitGatewayId,
      tags: [{
        key: 'Name',
        value: props.name
      }]
    });

    this.id = routeTable.ref;
  }

  public addPropagation(attachment: ITransitGatewayAttachment) {
    new ec2.CfnTransitGatewayRouteTablePropagation(this, `Propagation`, {
      transitGatewayAttachmentId: attachment.transitGatewayAttachmentId,
      transitGatewayRouteTableId: this.id
    });
  }

  public addAssociation(attachment: ITransitGatewayAttachment) {
    new ec2.CfnTransitGatewayRouteTableAssociation(this, `Association`, {
      transitGatewayRouteTableId: this.id,
      transitGatewayAttachmentId: attachment.transitGatewayAttachmentId
    });
  }
}
