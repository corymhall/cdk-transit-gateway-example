import { App, Stack } from '@aws-cdk/core';
import { TransitGatewayStack } from './stacks/tgw';
import * as tg from './constructs/transit-gateway';
import * as ssm from '@aws-cdk/aws-ssm';
import * as ec2 from '@aws-cdk/aws-ec2';

const app = new App();

if (!process.env.ORG_ARN) {
  throw new Error('ORG_ARN environment variable is required');
}

/*****************Step 1************************
 * ******************************************
 */

// create the transit gateway
const tgw = new TransitGatewayStack(app, 'Tgw', {
  env: {
    account: process.env.SHARED_SERVICES_ACCOUNT,
    region: 'us-east-2',
  },
  accountsToShareWith: [process.env.ORG_ARN!],
});

// storing the TgwId in a SSM parameter so that we can
// perform a lookup in other CDK apps
new ssm.StringParameter(tgw, 'TgwId', {
  stringValue: tgw.transitGateway.transitGatewayId,
  parameterName: 'tgw-id',
});


/*****************Step 3**********************************************
 * Can't be performed until after the attachment is created
 * in the cdk-sandbox-networking app
 * ******************************************************************
 */
// Create a stack to use to perform cross account lookups
const sandboxStack = new Stack(app, 'SandboxStack', {
  env: {
    account: process.env.SANDBOX_ACCOUNT,
    region: 'us-east-2',
  }
});

// lookup the VPC Transit Gateway attachment that was created in the Sandbox account.
// In the Sandbox CDK app where I create the Sandbox VPC, I make sure to create this SSM parameter
const attachmentId = ssm.StringParameter.valueFromLookup(sandboxStack, 'sandboxVpcAttachment-id');

// create a stack for the VPN Route Table
const vpnRouteTableStack = new Stack(app, 'VpnRouteTable', {
  env: { account: process.env.SHARED_SERVICES_ACCOUNT, region: 'us-east-2', }
});

// create the Route Table that you would associate the VPN with
const vpnRouteTable = new tg.TgwRouteTable(vpnRouteTableStack, 'VpnRouteTable', {
    transitGateway: tgw.transitGateway,
    name: 'VpnRouteTable',
  }
);


// create a stack for the VPC Route Table
const vpcRouteTableStack = new Stack(app, 'VpcRouteTable', {
  env: { account: process.env.SHARED_SERVICES_ACCOUNT, region: 'us-east-2', }
});

// create the Route Table that you would associate the VPC with
const vpcRouteTable = new tg.TgwRouteTable(vpcRouteTableStack, 'VpcRouteTable', {
    transitGateway: tgw.transitGateway,
    name: 'VpcRouteTable',
  }
);

// lookup the VPC attachment. We created this attachment in the Sandbox account, but since we are using
// RAM to share the transit gateway from the shared services account, it is also available here
const vpcAttachment = tg.TransitGatewayAttachment.fromTransitGatewayAttachmentAttributes(tgw, 'SandboxVpcAttachment', {
  transitGatewayId: tgw.transitGateway.transitGatewayId,
  transitGatewayAttachmentId: attachmentId,
});

// create an attachment to a VPC in the shared services account. This would be the same
// procedure for creating a VPN attachment
const ssAttachment = tgw.transitGateway.addVpcAttachment(
  ec2.Vpc.fromLookup(tgw, 'SharedServicesVpc', {
    vpcName: 'CoreStack/shared-services-vpc',
  }),
  {
    subnetType: ec2.SubnetType.PRIVATE,
  }
);

// VPN -> TGW -> SandboxVPC
vpnRouteTable.addPropagation(vpcAttachment);
vpnRouteTable.addAssociation(ssAttachment);


// SandboxVPC -> TGW -> VPN
vpcRouteTable.addAssociation(vpcAttachment);
vpcRouteTable.addPropagation(ssAttachment);
