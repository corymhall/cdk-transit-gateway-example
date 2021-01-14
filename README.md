# CDK Transit Gateway Example

This is an example of how to manage a Transit Gateway with the CDK, taking into account cross account attachments.

This example shows how you could do this while utilizing two separate CDK apps.

1. [cdk-shared-services-tgw](./cdk-shared-services-tgw)
This CDK app owns creating and managing the Transit Gateway that we will create in our "Shared Services" AWS account.
This will manage creating:

- Transit Gateway
- Transit Gateway Route Tables
- Resource Access Manager share

1. [cdk-sandbox-networking](./cdk-sandbox-netwoking)
This CDK app owns creating and managing the networking infrastructure in our "Sandbox" AWS account.
In this account we will create:

- VPC
- Transit Gateway Attachment to the TGW created in the `cdk-shared-services-tgw` app
- VPC Route Table Routes to the TGW



The infrastructure in this example needs to be created in multiple steps.

**Step 1**

- Create the Transit Gateway in the `cdk-shared-services-tgw` app.
- Create the VPC in the `cdk-sandbox-networking` app

**Step 2**

- Create the Transit Gateway attachment to the VPC in the `cdk-sandbox-networking` app


**Step 3**

- associate/propagate the VPC to the Transit Gateway Route tables
