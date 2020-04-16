import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';

export interface SiteToSiteVpnProps extends cdk.StackProps {
  transitGatewayId: string;
}

export class SiteToSiteVpn extends cdk.Stack {
  public readonly vpnId: string;

  constructor(scope: cdk.Construct, id: string, props: SiteToSiteVpnProps) {
    super(scope, id, props);

    const customerGateway = new ec2.CfnCustomerGateway(this, 'CustomerGateway', {
      type: 'ipsec.1',
      bgpAsn: 65000,
      ipAddress: '3.135.234.130' // Dummy value for testing
    });

    const vpn = new ec2.CfnVPNConnection(this, 'VpnTgwConnection', {
      type: 'ipsec.1',
      customerGatewayId: customerGateway.ref,
      transitGatewayId: props.transitGatewayId,
    });

    this.vpnId = vpn.ref;
  }
}
