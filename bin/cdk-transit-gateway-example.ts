#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import { TransitGatewayExample } from '../lib/transit-gateway-example';
import * as attachment from '../lib/transit-gateway-attachment';
import { VpcExample } from '../lib/vpc-example';
import { SiteToSiteVpn } from '../lib/site-to-site-vpn';

const env = {
  account: process.env.AWS_ACCOUNT,
  region: 'us-east-2'
}

const app = new cdk.App();

const tgw = new TransitGatewayExample(app, 'TransitGateway', {
  env
});

const vpn = new SiteToSiteVpn(app, 'Vpn', {
  transitGatewayId: tgw.transitGateway.transitGatewayId,
  env
});

const vpnAttachment = attachment.TransitGatewayAttachment.fromTransitGatewayAttachmentAttributes(cdk.Stack.of(vpn), 'VpnAttachment', {
  transitGatewayId: tgw.transitGateway.transitGatewayId,
  transitGatewayAttachmentId: 'tgw-attach-072d648126675cc7a'
});

tgw.defaultRouteTable.addAssociation(vpnAttachment);

const vpcExample = new VpcExample(app, 'VpcExample', {env});
const vpcAttachment = tgw.transitGateway.addVpcAttachment(vpcExample.vpc, { subnetType: ec2.SubnetType.ISOLATED });
// tgw.defaultRouteTable.addAssociation(vpcAttachment);
// tgw.defaultRouteTable.addPropagation(vpcAttachment);
