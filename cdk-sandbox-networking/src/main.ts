import { App, Stack } from '@aws-cdk/core';
import { SandboxNetworkingStack } from './stacks/sandbox-networking';

const app = new App();

const environment = {
  account: process.env.SANDBOX_ACCOUNT,
  region: 'us-east-2'
}

const app = new cdk.App();

// create our VPC in the sandbox account
const networking = new SandboxNetworkingStack(app, 'SandboxNetworkingStack', {
  env: environment
});

/***********************************************************************************
 * *****************************Step 2**********************************************
 * Must be done after Step 1 (creating Transit Gateway in cdk-shared-services-tgw)
 * *********************************************************************************
 */
const tgwStack = new cdk.Stack(app, 'TgwStack', {
  env: environment,
});

// create our lookup stack to perform our cross account lookup from
// the shared services account where the transit gateway exists
const tgwLookupStack = new cdk.Stack(app, 'TgwLookup', {
  env: {
    account: process.env.SHARED_SERVICES_ACCOUNT,
    region: 'us-east-2',
  }
});

// lookup the transit gateway id from the ssm parameter store parameter that we created
// in the shared services app
const tgwId = ssm.StringParameter.valueFromLookup(tgwLookupStack, 'tgw-id'); 
// create the imported transit gateway
const tgw = tg.TransitGateway.fromTransitGatewayId(tgwStack, 'Tgw', tgwId);

// attach the sandbox vpc to the transit gateway
const tgwAttachment = tgw.addVpcAttachment(
  networking.vpc,
  {
    subnets: networking.vpc.privateSubnets
  },
);

// create a ssm parameter to store the vpc attachment id.
// we will need this back in the shared services account to attach this to the transit gateway
// route table
new ssm.StringParameter(tgwStack, 'SandboxVpcAttachmentId', {
  stringValue: tgwAttachment.transitGatewayAttachmentId,
  parameterName: 'sandboxVpcAttachment-id'
});
