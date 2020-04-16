import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import { ITransitGateway } from './transit-gateway';

export interface TransitGatewayAttachmentProps extends cdk.StackProps {
  vpc: ec2.IVpc;
  transitGateway: ITransitGateway;
  subnets: ec2.SubnetSelection;
}

export interface ITransitGatewayAttachment extends cdk.IResource {
  readonly transitGatewayAttachmentId: string;
}

abstract class TransitGatewayAttachmentBase extends cdk.Resource implements ITransitGatewayAttachment {
  /**
   * The id of the Attachment
   *
   * @attribute
   */
  public abstract readonly transitGatewayAttachmentId: string;
  public abstract readonly transitGatewayId: string;
}

export interface TransitGatewayAttachmentAttributes {
  transitGatewayId: string;
  transitGatewayAttachmentId: string;
}

/**
 *
 * @resource AWS::EC2::TransitGatewayAttachment
 */
export class TransitGatewayAttachment extends TransitGatewayAttachmentBase {
  public readonly transitGatewayAttachmentId: string;
  public readonly transitGatewayId: string;

  public static fromTransitGatewayAttachmentAttributes(scope: cdk.Construct, id: string, attrs: TransitGatewayAttachmentAttributes): ITransitGatewayAttachment {
    class Import extends TransitGatewayAttachmentBase {
      public transitGatewayAttachmentId = attrs.transitGatewayAttachmentId;
      public transitGatewayId = attrs.transitGatewayId;
    }

    return new Import(scope, id);
  }

  constructor(scope: cdk.Construct, id: string, props: TransitGatewayAttachmentProps) {
    super(scope, id, {
      physicalName: ''
    });

    const attachment = new ec2.CfnTransitGatewayAttachment(this, `TgwAttachment`, {
      vpcId: props.vpc.vpcId,
      transitGatewayId: props.transitGateway.transitGatewayId,
      subnetIds: props.vpc.selectSubnets(props.subnets).subnetIds
    });
    this.transitGatewayId = attachment.transitGatewayId;

    this.transitGatewayAttachmentId = attachment.ref;
  }
}
