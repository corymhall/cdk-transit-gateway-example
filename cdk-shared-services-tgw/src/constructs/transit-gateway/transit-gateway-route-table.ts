import * as ec2 from '@aws-cdk/aws-ec2';
import * as cdk from '@aws-cdk/core';
import { ITransitGateway } from './transit-gateway';
import { ITransitGatewayAttachment } from './transit-gateway-attachment';
import * as ssm from '@aws-cdk/aws-ssm';

export interface TgwRouteTableProps {
  transitGateway: ITransitGateway;
  name: string;
}

export interface ITgwRouteTable {
  readonly id: string;

  addPropagation(attachment: ITransitGatewayAttachment, attachmentName?: string): void;
  addAssociation(attachment: ITransitGatewayAttachment, attachmentName?: string): void;
}

export class TgwRouteTable extends cdk.Construct implements ITgwRouteTable {
  public readonly id: string;
  private readonly name: string;

  constructor(scope: cdk.Construct, id: string, props: TgwRouteTableProps) {
    super(scope, id);

    this.name = props.name;

    const routeTable = new ec2.CfnTransitGatewayRouteTable(this, 'RouteTable', {
      transitGatewayId: props.transitGateway.transitGatewayId,
      tags: [{
        key: 'Name',
        value: props.name,
      }],
    });

    this.id = routeTable.ref;
  }

  public addPropagation(attachment: ITransitGatewayAttachment, attachmentName?: string) {
    var attachmentId: string

    // if the attachment is in a different account then we need to
    // perform a cross account lookup
    if (cdk.Stack.of(attachment).account != cdk.Stack.of(this).account) {
      attachmentId = ssm.StringParameter.valueFromLookup(cdk.Stack.of(attachment), `${attachmentName}-id`);
    } else {
      attachmentId = attachment.transitGatewayAttachmentId;
    }
    // create propagation in the same stack as the route table
    new ec2.CfnTransitGatewayRouteTablePropagation(cdk.Stack.of(this), `${this.name}Propagation`, {
      transitGatewayAttachmentId: attachmentId,
      transitGatewayRouteTableId: this.id,
    });
  }

  public addAssociation(attachment: ITransitGatewayAttachment, attachmentName?: string) {
    var attachmentId: string;
    if (cdk.Stack.of(attachment).account != cdk.Stack.of(this).account) {
      attachmentId = ssm.StringParameter.valueFromLookup(cdk.Stack.of(attachment), `${attachmentName}-id`);
    } else {
      attachmentId = attachment.transitGatewayAttachmentId;
    }
    new ec2.CfnTransitGatewayRouteTableAssociation(cdk.Stack.of(this), `${this.name}Association`, {
      transitGatewayRouteTableId: this.id,
      transitGatewayAttachmentId: attachmentId,
    });
  }
}
